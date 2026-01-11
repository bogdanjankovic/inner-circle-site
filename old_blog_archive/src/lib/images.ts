export const IMAGE_CATEGORIES: Record<string, string[]> = {
    TECH: [
        "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=1920&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1920&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1920&auto=format&fit=crop",
    ],
    CODING: [
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1920&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1920&auto=format&fit=crop",
    ],
    GAMING: [
        "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1920&auto=format&fit=crop", // Gamer
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1920&auto=format&fit=crop", // E-sports
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1920&auto=format&fit=crop", // Gaming setup
    ],
    AI: [
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1920&auto=format&fit=crop", // AI Brain
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1920&auto=format&fit=crop", // AI Abstract
    ],
    SCIENCE: [
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop", // Earth/Space
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1920&auto=format&fit=crop", // Lab
    ]
};

export function getImageForCategory(category: string): string {
    const key = category.toUpperCase();
    const images = IMAGE_CATEGORIES[key] || IMAGE_CATEGORIES.TECH;
    return images[Math.floor(Math.random() * images.length)];
}

export function getRandomImage(): string {
    return getImageForCategory('TECH');
}
