import { IUser } from "shared";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { database as defaultDb, Database } from "../database";
import { users } from "../database/schema";

// On conserve le nom IUserDocument (sans Mongoose) pour ne casser aucun import dans tes contrôleurs
export interface IUserDocument extends IUser {
    _id: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export default class UserRepository {
    constructor(private db: Database = defaultDb) {}

    public async findAll(): Promise<IUserDocument[]> {
        const rows = await this.db.query.users.findMany({
            columns: { password: false }, // Imite le select: false de Mongoose
            with: { offers: true }
        });

        return rows.map((row) => this.toDomain(row));
    }

    public async findById(id: string): Promise<IUserDocument | null> {
        const row = await this.db.query.users.findFirst({
            where: { _id: id },
            columns: { password: false },
            with: { offers: true }
        });

        return row ? this.toDomain(row) : null;
    }

    public async findByEmail(email: string): Promise<IUserDocument | null> {
        const row = await this.db.query.users.findFirst({
            where: { email },
            columns: { password: false },
            with: { offers: true }
        });

        return row ? this.toDomain(row) : null;
    }

    public async findByEmailWithPassword(email: string): Promise<IUserDocument | null> {
        // Ici on ne met pas columns: { password: false }, donc le mot de passe est inclus
        const row = await this.db.query.users.findFirst({
            where: { email },
            with: { offers: true }
        });

        return row ? this.toDomain(row) : null;
    }

    public async create(userData: IUser): Promise<IUserDocument> {
        const { offers: _offers, ...insertData } = userData as any;

        // Remplace ton hook userSchema.pre("save") pour hacher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const [created] = await this.db
            .insert(users)
            .values({
                ...insertData,
                password: hashedPassword
            })
            .returning();

        return this.toDomain({ ...created, offers: [] });
    }

    public async update(id: string, updateData: Partial<IUser>): Promise<IUserDocument | null> {
        const { offers: _offers, ...fieldsToUpdate } = updateData as any;

        // Si le mot de passe est modifié, on le hache avant la mise à jour
        if (fieldsToUpdate.password) {
            const salt = await bcrypt.genSalt(10);
            fieldsToUpdate.password = await bcrypt.hash(fieldsToUpdate.password, salt);
        }

        const [updated] = await this.db
            .update(users)
            .set(fieldsToUpdate)
            .where(eq(users._id, id))
            .returning();

        if (!updated) return null;

        return this.findById(id);
    }

    // ==========================================
    // MAPPING : Objet ORM Drizzle -> Objet Métier IUserDocument
    // ==========================================
    private toDomain(row: any): IUserDocument {
        return {
            ...row,
            offers: row.offers ?? [],
            comparePassword: async (candidatePassword: string): Promise<boolean> => {
                if (!row.password) {
                    throw new Error("Password non chargé. Utilisez findByEmailWithPassword.");
                }
                return bcrypt.compare(candidatePassword, row.password);
            }
        } as unknown as IUserDocument;
    }
}