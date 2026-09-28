import { pgTable, uuid, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { defineRelations } from "drizzle-orm";
import { OfferStatus } from "shared";


export const users = pgTable("users", {
    _id: uuid("_id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    password: text("password").notNull(),
    rating: integer("rating").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),

    bio: text("bio"),
    avatar: text("avatar"),
    location: text("location"),
});


export const offers = pgTable("offers", {
    _id: uuid("_id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    available: boolean("available").default(true).notNull(),
    category: text("category").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    exchange: text("exchange"),
    location: text("location"),
    pictures: text("pictures").array().default([]).notNull(),

    sellerID: uuid("seller_id")
        .notNull()
        .references(() => users._id, { onDelete: "cascade" }),

    status: text("status").$type<OfferStatus>().default(OfferStatus.AVAILABLE).notNull(),

    reservedTo: uuid("reserved_to")
        .references(() => users._id, { onDelete: "set null" }),
});


export const chats = pgTable("chats", {
    _id: uuid("_id").defaultRandom().primaryKey(),
    
    offerID: uuid("offer_id")
        .notNull()
        .references(() => offers._id, { onDelete: "cascade" }),
        
    buyerID: uuid("buyer_id")
        .notNull()
        .references(() => users._id, { onDelete: "cascade" }),
        
    sellerID: uuid("seller_id")
        .references(() => users._id, { onDelete: "set null" }),
});


export const messages = pgTable("messages", {
    _id: uuid("_id").defaultRandom().primaryKey(),
    
    chatID: uuid("chat_id")
        .notNull()
        .references(() => chats._id, { onDelete: "cascade" }),
        
    sender: uuid("sender_id")
        .notNull()
        .references(() => users._id, { onDelete: "cascade" }),
        
    content: text("content").notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
});


export const relations = defineRelations(
    { users, offers, chats, messages },
    (r) => ({
        users: {
            offers: r.many.offers({
                from: r.users._id,
                to: r.offers.sellerID,
                alias: "seller_offers",
            }),
        },
        offers: {
            seller: r.one.users({
                from: r.offers.sellerID,
                to: r.users._id,
                optional: false, // Car sellerID est .notNull()
                alias: "seller_offers",
            }),
            reservedUser: r.one.users({
                from: r.offers.reservedTo,
                to: r.users._id,
                alias: "reserved_offers",
            }),
            chats: r.many.chats({
                from: r.offers._id,
                to: r.chats.offerID,
            }),
        },
        chats: {
            offer: r.one.offers({
                from: r.chats.offerID,
                to: r.offers._id,
                optional: false,
            }),
            buyer: r.one.users({
                from: r.chats.buyerID,
                to: r.users._id,
                optional: false,
                alias: "buyer_chats",
            }),
            seller: r.one.users({
                from: r.chats.sellerID,
                to: r.users._id,
                alias: "seller_chats",
            }),
            messages: r.many.messages({
                from: r.chats._id,
                to: r.messages.chatID,
            }),
        },
        messages: {
            chat: r.one.chats({
                from: r.messages.chatID,
                to: r.chats._id,
                optional: false,
            }),
            senderUser: r.one.users({
                from: r.messages.sender,
                to: r.users._id,
                optional: false,
            }),
        },
    })
);