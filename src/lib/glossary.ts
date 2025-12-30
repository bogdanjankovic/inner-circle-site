export interface TermDefinition {
    term: string;
    description: string;
    category: 'TECH' | 'GAMEPLAY' | 'LORE' | 'HARDWARE';
}

export const GLOSSARY: Record<string, TermDefinition> = {
    // Graphics & Tech
    "Ray Tracing": {
        term: "Ray Tracing",
        description: "A rendering technique for generating an image by tracing the path of light as pixels in an image plane and simulating the effects of its encounters with virtual objects.",
        category: "TECH"
    },
    "DLSS": {
        term: "DLSS",
        description: "Deep Learning Super Sampling. Nvidia's AI-powered technology that upscales lower-resolution images to higher resolutions, boosting frame rates without sacrificing quality.",
        category: "TECH"
    },
    "FSR": {
        term: "FSR",
        description: "FidelityFX Super Resolution. AMD's upscaling technology, similar to AI upscaling, working across a broad range of GPUs to improve performance.",
        category: "TECH"
    },
    "FPS": {
        term: "FPS",
        description: "Frames Per Second. The frequency at which consecutive images (frames) appear on a display. Higher is smoother.",
        category: "TECH"
    },
    "Latency": {
        term: "Latency",
        description: "The delay between a user's action and the web application's response to that action, often measured in milliseconds.",
        category: "TECH"
    },
    "OLED": {
        term: "OLED",
        description: "Organic Light-Emitting Diode. A display technology where each pixel provides its own light, offering perfect blacks and infinite contrast ratios.",
        category: "HARDWARE"
    },
    "IPS": {
        term: "IPS",
        description: "In-Plane Switching. A type of screen technology for liquid-crystal displays (LCDs) known for accurate colors and wide viewing angles.",
        category: "HARDWARE"
    },
    "Refresh Rate": {
        term: "Refresh Rate",
        description: "The number of times per second that a raster-based display hardware updates its buffer, measured in Hertz (Hz).",
        category: "HARDWARE"
    },

    // Gameplay
    "Hitbox": {
        term: "Hitbox",
        description: "An invisible shape used in video games for real-time collision detection to determine if an entity has been hit by an attack.",
        category: "GAMEPLAY"
    },
    "RNG": {
        term: "RNG",
        description: "Random Number Generation. Algorithms used to determine random events, such as loot drops or critical hits.",
        category: "GAMEPLAY"
    },
    "NPC": {
        term: "NPC",
        description: "Non-Player Character. Any character in a game that is not controlled by a player.",
        category: "GAMEPLAY"
    },
    "Aggro": {
        term: "Aggro",
        description: "Short for 'aggravation'. The attention of an enemy NPC towards a specific player character.",
        category: "GAMEPLAY"
    },
    "Meta": {
        term: "Meta",
        description: "Most Effective Tactic Available. The dominant strategy or set of loadouts currently favoring the highest win rates.",
        category: "GAMEPLAY"
    },
    "Immersion": {
        term: "Immersion",
        description: "The state of being deeply engaged or involved; suspension of disbelief where the player feels 'inside' the game world.",
        category: "LORE"
    },
    "Atmosphere": {
        term: "Atmosphere",
        description: "The mood or tone set by a game's visual design, lighting, and sound, contributing to the emotional experience.",
        category: "LORE"
    }
};
