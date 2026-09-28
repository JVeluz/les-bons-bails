// src/services/UserService.ts
import { IUser } from "shared";
import UserRepository, { IUserDocument } from "../repositories/UserRepository";
import jwt from "jsonwebtoken";

export default class UserService {

    public constructor(
        private userRepository = new UserRepository()
    ) { }

    public async getById(id: string): Promise<Partial<IUser>> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error("User not found");
        }
        return this.sanitizeUser(user);
    }

    public async getAll(): Promise<Partial<IUser>[]> {
        const users = await this.userRepository.findAll();
        return users.map(user => this.sanitizeUser(user));
    }

    public async register(data: Partial<IUser>): Promise<{ user: Partial<IUser>, token: string }> {
        if (!data.email || !data.name) throw new Error("Email and name are required");

        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser)
            throw new Error("Email already in use");

        const user = await this.userRepository.create(data as IUser);

        const token = this.generateToken(user);

        return { user: this.sanitizeUser(user), token };
    }

    public async login(data: Pick<IUser, 'email' | 'password'>): Promise<{ user: Partial<IUser>, token: string }> {
        const { email, password } = data;
        if (!email || !password) throw new Error("Email and password are required");

        const user = await this.userRepository.findByEmailWithPassword(email);

        if (!user || !(await user.comparePassword(password))) {
            throw new Error("Invalid email or password");
        }

        const token = this.generateToken(user);

        return { user: this.sanitizeUser(user), token };
    }

    public async update(id: string, data: Partial<IUser>): Promise<any> {
        const updatedUser = await this.userRepository.update(id, data);
        if (!updatedUser)
            throw new Error("User not found");

        return this.sanitizeUser(updatedUser);
    }

    private generateToken(user: IUserDocument): string {
        return jwt.sign(
            { userID: user._id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '1h' }
        );
    }

    private sanitizeUser(user: IUserDocument): Partial<IUser> {
        const { password, comparePassword, ...cleanUser } = user as any;
        return cleanUser;
    }
}