import { IChat } from "shared";
import { database as defaultDb, Database } from "../database";
import { chats, messages } from "../database/schema";

export default class ChatRepository {
    constructor(private db: Database = defaultDb) {}

    public async get(chatID: string): Promise<IChat | null> {
        const row = await this.db.query.chats.findFirst({
            where: { _id: chatID },
            with: {
                buyer: {
                    columns: { _id: true, name: true, avatar: true }
                },
                offer: {
                    columns: { _id: true, title: true }
                },
                messages: {
                    with: {
                        senderUser: {
                            columns: { _id: true, name: true }
                        }
                    }
                }
            }
        });

        return row ? this.toDomain(row) : null;
    }

    public async getByOfferAndBuyer(offerID: string, buyerID: string): Promise<IChat | null> {
        const row = await this.db.query.chats.findFirst({
            where: { offerID, buyerID },
            with: {
                buyer: {
                    columns: { _id: true, name: true }
                },
                offer: {
                    columns: { _id: true, title: true }
                },
                messages: {
                    with: {
                        senderUser: {
                            columns: { _id: true, name: true }
                        }
                    }
                }
            }
        });

        return row ? this.toDomain(row) : null;
    }

    public async create(offerID: string, buyerID: string): Promise<IChat> {
        const [created] = await this.db
            .insert(chats)
            .values({ offerID, buyerID })
            .returning();

        return {
            ...created,
            messages: []
        } as unknown as IChat;
    }

    public async getMessages(chatID: string): Promise<IChat | null> {
        const row = await this.db.query.chats.findFirst({
            where: { _id: chatID },
            columns: { _id: true },
            with: {
                messages: {
                    with: {
                        senderUser: {
                            columns: { _id: true, name: true }
                        }
                    }
                }
            }
        });

        if (!row) return null;

        return {
            _id: row._id,
            messages: row.messages.map((m: any) => ({
                _id: m._id,
                content: m.content,
                timestamp: m.timestamp,
                sender: m.senderUser ?? m.sender
            }))
        } as unknown as IChat;
    }

    public async sendMessage(chatID: string, senderID: string, content: string): Promise<void> {
        // Plus besoin de $push dans le document Chat : on insère une ligne dans la table messages !
        await this.db.insert(messages).values({
            chatID,
            sender: senderID,
            content,
            timestamp: new Date()
        });
    }

    // ==========================================
    // MAPPING : Objet ORM Drizzle -> Objet Métier IChat
    // ==========================================
    private toDomain(row: any): IChat {
        const { buyer, offer, messages: rawMessages, ...chatFields } = row;

        return {
            ...chatFields,
            buyerID: buyer ?? chatFields.buyerID,
            offerID: offer ?? chatFields.offerID,
            messages: (rawMessages ?? []).map((m: any) => {
                const { senderUser, ...msgFields } = m;
                return {
                    ...msgFields,
                    sender: senderUser ?? m.sender
                };
            })
        } as unknown as IChat;
    }
}