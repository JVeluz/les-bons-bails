// src/db/seed.ts
import bcrypt from "bcryptjs";
import { database } from "../database";
import { users, offers, chats, messages } from "./schema";
import { OfferStatus } from "shared";

async function seed() {
    console.log("🌱 Vérification de la base de données...");

    const existingUsers = await database.query.users.findMany({ limit: 1 });
    if (existingUsers.length > 0) {
        console.log("✅ La base contient déjà des données. Seed ignoré.");
        process.exit(0);
    }

    console.log("🚀 Base vide détectée ! Insertion des données de démonstration...");

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash("123", salt);

    const [alice, thomas, chloe] = await database
        .insert(users)
        .values([
            {
                name: "Alice Martin",
                email: "alice@demo.fr",
                password: defaultPassword,
                rating: 5,
                bio: "Passionnée de déco vintage et de plantes. Je vide mon appart avant déménagement !",
                avatar: "https://placehold.co/100x100?text=Alice",
                location: "Lyon (69007)",
            },
            {
                name: "Thomas Dubois",
                email: "thomas@demo.fr",
                password: defaultPassword,
                rating: 4,
                bio: "Étudiant en informatique, adepte du troc électronique et vélo.",
                avatar: "https://placehold.co/100x100?text=Thomas",
                location: "Villeurbanne (69100)",
            },
            {
                name: "Chloé Bernard",
                email: "chloe@demo.fr",
                password: defaultPassword,
                rating: 5,
                bio: "Fan de jeux de société et de lecture. Toujours partante pour échanger !",
                avatar: "https://placehold.co/100x100?text=Chloé",
                location: "Lyon (69003)",
            },
        ])
        .returning();

    const [offreMonstera, offreClavier, offreJeu, offreLampe] = await database
        .insert(offers)
        .values([
            {
                title: "Grande Monstera Deliciosa avec pot en terre cuite",
                description: "Magnifique Monstera de 1m20 en pleine santé. Trop grande pour mon futur studio, à venir chercher sur place.",
                available: true,
                category: "Jardin & Plantes",
                exchange: "Une bouture rare ou un bon paquet de café en grains",
                location: "Lyon (69007)",
                pictures: ["https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800"],
                sellerID: alice._id,
                status: OfferStatus.AVAILABLE,
            },
            {
                title: "Clavier mécanique Keychron K2 (Switchs Brown)",
                description: "Clavier sans fil rétroéclairé en parfait état avec sa boîte d'origine et son câble tressé.",
                available: false,
                category: "Informatique",
                exchange: "Un casque audio ou une souris ergonomique",
                location: "Villeurbanne (69100)",
                pictures: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800"],
                sellerID: thomas._id,
                // Cette offre simule une commande / réservation en cours par Chloé !
                status: OfferStatus.AVAILABLE,
                reservedTo: chloe._id,
            },
            {
                title: "Jeu de société Catan (Édition complète)",
                description: "Boîte complète en excellent état, toutes les cartes et pions sont présents. Idéal pour les soirées entre amis.",
                available: true,
                category: "Loisirs & Jeux",
                exchange: "Un autre jeu de société (7 Wonders, Carcassonne...)",
                location: "Lyon (69003)",
                pictures: ["https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800"],
                sellerID: chloe._id,
                status: OfferStatus.AVAILABLE,
            },
            {
                title: "Lampe de bureau articulée style industriel",
                description: "Lampe en métal noir mat, ampoule Edison à filament fournie. Donne un super cachet à un bureau.",
                available: true,
                category: "Maison & Déco",
                exchange: "2 places de cinéma ou une BD",
                location: "Lyon (69007)",
                pictures: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"],
                sellerID: alice._id,
                status: OfferStatus.AVAILABLE,
            },
        ])
        .returning();

    // Conversation 1 : Thomas s'intéresse à la Monstera d'Alice
    const [chatMonstera] = await database
        .insert(chats)
        .values({
            offerID: offreMonstera._id,
            buyerID: thomas._id,
            sellerID: alice._id,
        })
        .returning();

    // Conversation 2 : Chloé réserve le clavier mécanique de Thomas
    const [chatClavier] = await database
        .insert(chats)
        .values({
            offerID: offreClavier._id,
            buyerID: chloe._id,
            sellerID: thomas._id,
        })
        .returning();

    const now = Date.now();
    const min = 60 * 1000;

    await database.insert(messages).values([
        // Échanges sur la Monstera
        {
            chatID: chatMonstera._id,
            sender: thomas._id,
            content: "Salut Alice ! Ta Monstera est toujours dispo ? J'ai un paquet de café de spécialité d'Éthiopie tout neuf si ça te tente !",
            timestamp: new Date(now - 120 * min),
        },
        {
            chatID: chatMonstera._id,
            sender: alice._id,
            content: "Bonjour Thomas ! Oui elle est toujours là, et j'adore le café éthiopien. Tu serais dispo quand pour passer la récupérer ?",
            timestamp: new Date(now - 115 * min),
        },
        {
            chatID: chatMonstera._id,
            sender: thomas._id,
            content: "Je peux passer demain vers 18h30 après mes cours, ça te va ?",
            timestamp: new Date(now - 100 * min),
        },

        // Échanges sur le Clavier 
        {
            chatID: chatClavier._id,
            sender: chloe._id,
            content: "Hello Thomas ! J'ai une souris Logitech MX Master 2S en super état à échanger contre ton clavier Keychron, ça t'intéresse ?",
            timestamp: new Date(now - 300 * min),
        },
        {
            chatID: chatClavier._id,
            sender: thomas._id,
            content: "Salut Chloé ! Carrément, je cherchais justement une MX Master ! Je te réserve l'annonce tout de suite.",
            timestamp: new Date(now - 280 * min),
        },
        {
            chatID: chatClavier._id,
            sender: chloe._id,
            content: "Génial merci ! On se retrouve place Bellecour samedi après-midi pour l'échange ?",
            timestamp: new Date(now - 260 * min),
        },
    ]);

    console.log("🎉 Seed terminé avec succès ! (3 utilisateurs, 4 offres, 2 chats, 6 messages)");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Erreur lors du seed :", err);
    process.exit(1);
});