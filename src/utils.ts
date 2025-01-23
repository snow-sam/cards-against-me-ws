import fs from 'fs';
import path from 'path';

export const getJson = (arqPath: string) => {
    const arq = path.join(process.cwd(), arqPath);
    try {
      const data = fs.readFileSync(arq, 'utf8');
      const dataJson = JSON.parse(data);
      return dataJson;
    } catch (error) {
      console.error('Error reading the JSON file:', error);
      return '';
    }
}

export const deckShuffle = (deck: string[]) => {
    let newDeck = deck
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]; // Troca os elementos
    }
    return newDeck
}