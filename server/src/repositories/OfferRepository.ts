// src/repositories/OfferRepository.ts
import { IOffer } from "shared";
import { eq } from "drizzle-orm";
import { database as defaultDb, Database } from "../database";
import { offers } from "../database/schema";

export default class OfferRepository {
    constructor(private db: Database = defaultDb) {}

    public async findAll(): Promise<IOffer[]> {
        const rows = await this.db.query.offers.findMany({
            with: {
                seller: {
                    columns: { _id: true, name: true, rating: true, avatar: true }
                },
                chats: {
                    columns: { _id: true }
                }
            }
        });

        return rows.map((row) => this.toDomain(row));
    }

    public async findById(id: string): Promise<IOffer | null> {
        const row = await this.db.query.offers.findFirst({
            where: { _id: id },
            with: {
                seller: {
                    columns: { _id: true, name: true, rating: true, avatar: true, email: true }
                },
                chats: {
                    with: {
                        messages: true
                    }
                }
            }
        });

        return row ? this.toDomain(row, true) : null;
    }

    public async findByTerms(terms: string): Promise<IOffer[]> {
        // Remplace ton $or +$regex insensible à la casse ('i')
        const rows = await this.db.query.offers.findMany({
            where: {
                OR: [
                    { title: { ilike: `%${terms}%` } },
                    { description: { ilike: `%${terms}%` } }
                ]
            },
            with: {
                seller: {
                    columns: { _id: true, name: true, rating: true, avatar: true }
                },
                chats: {
                    columns: { _id: true }
                }
            }
        });

        return rows.map((row) => this.toDomain(row));
    }

    public async create(offerData: IOffer): Promise<IOffer> {
        // On extrait les éventuels champs relationnels avant l'insertion SQL
        const { chatIDs, ...insertData } = offerData as any;

        const [created] = await this.db
            .insert(offers)
            .values({
                ...insertData,
                sellerID: typeof offerData.sellerID === "object" 
                    ? (offerData.sellerID as any)._id 
                    : offerData.sellerID
            })
            .returning();

        return {
            ...created,
            chatIDs: []
        } as unknown as IOffer;
    }

    public async delete(id: string): Promise<IOffer | null> {
        // Note : PostgreSQL supprime automatiquement les chats liés grâce à onDelete: "cascade" !
        const [deleted] = await this.db
            .delete(offers)
            .where(eq(offers._id, id))
            .returning();

        return deleted ? ({ ...deleted, chatIDs: [] } as unknown as IOffer) : null;
    }

    public async update(updateData: Partial<IOffer> & { _id: string }): Promise<IOffer | null> {
        const { _id, chatIDs, sellerID, ...fieldsToUpdate } = updateData as any;

        // Si sellerID est passé (sous forme d'ID ou d'objet), on garde uniquement l'UUID
        if (sellerID) {
            fieldsToUpdate.sellerID = typeof sellerID === "object" ? sellerID._id : sellerID;
        }

        const [updated] = await this.db
            .update(offers)
            .set(fieldsToUpdate)
            .where(eq(offers._id, _id))
            .returning();

        if (!updated) return null;

        // On renvoie l'offre mise à jour avec son seller peuplé (comme ton .populate("sellerID"))
        return this.findById(_id);
    }

    // ==========================================
    // MAPPING : Objet ORM Drizzle -> Objet Métier IOffer
    // ==========================================
    private toDomain(row: any, populateChats = false): IOffer {
        const { seller, chats, ...offerFields } = row;
        return {
            ...offerFields,
            sellerID: seller ?? offerFields.sellerID,
            chatIDs: populateChats 
                ? (chats ?? []) 
                : (chats ? chats.map((c: any) => c._id) : [])
        } as unknown as IOffer;
    }
}