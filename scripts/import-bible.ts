import AdmZip from "adm-zip";
import { parse } from "node-html-parser";
import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";
import * as dotenv from "dotenv";

// Load env from the Next.js app root
dotenv.config({ path: resolve(__dirname, "../app/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in app/.env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const epubPath = resolve(__dirname, "bible-source/nwt_T.epub");

async function importBible() {
  console.log("Reading EPUB:", epubPath);
  const zip = new AdmZip(epubPath);
  const zipEntries = zip.getEntries();

  // Book mapping (index -> book number)
  // We know that biblechapternav1.xhtml is Genesis, biblechapternav43.xhtml is John, etc.
  
  let versesBuffer: any[] = [];
  
  // We will scan all xhtml files for spans with id="chapter{N}_verse{V}"
  // But wait, how do we know which BOOK it is?
  // The structure is: 
  // 1001061105.xhtml, 1001061105-split2.xhtml etc...
  // Each book has a base docId (e.g. 1001061105).
  // Actually, we can get the book from the navigation, but it's simpler to parse the chapter and verse and we need the book number.
  // Wait, let's look at a file again: 
  // <p class="w_navigation w_biblebookname"><a href="biblebooknav.xhtml">Gênesis</a>
  // So the book name is inside the file!
  
  console.log("This script requires a more sophisticated parsing of the specific NWT EPUB structure.");
  console.log("For the sake of the MVP, we will parse the known structure.");

  // For a robust implementation, we would:
  // 1. Parse content.opf to get the reading order (spine) of xhtml files.
  // 2. Iterate through them in order.
  // 3. Keep track of the current Book (by looking for headers or known docIds).
  // 4. Extract <span id="chapter{C}_verse{V}"> and all text until the next verse span.

  // 1. Get Spine
  const contentOpfEntry = zipEntries.find(e => e.entryName.endsWith("content.opf"));
  if (!contentOpfEntry) throw new Error("content.opf not found");
  
  const opfContent = contentOpfEntry.getData().toString("utf8");
  const opfRoot = parse(opfContent);
  
  // Get item hrefs
  const items: Record<string, string> = {};
  opfRoot.querySelectorAll("item").forEach(item => {
    items[item.getAttribute("id") || ""] = item.getAttribute("href") || "";
  });

  // Get spine order
  const spineItemRefs = opfRoot.querySelectorAll("itemref").map(ref => ref.getAttribute("idref") || "");
  const orderedFiles = spineItemRefs.map(idref => items[idref]).filter(href => href && href.endsWith(".xhtml"));

  console.log(`Found ${orderedFiles.length} files in reading order.`);

  let currentBookNumber = 0;
  let currentBookName = "";
  
  // We need the BIBLE_BOOKS list to match names to numbers
  const BIBLE_BOOKS = [
    { number: 1, name: "Gênesis" }, { number: 2, name: "Êxodo" }, { number: 3, name: "Levítico" },
    { number: 4, name: "Números" }, { number: 5, name: "Deuteronômio" }, { number: 6, name: "Josué" },
    { number: 7, name: "Juízes" }, { number: 8, name: "Rute" }, { number: 9, name: "1 Samuel" },
    { number: 10, name: "2 Samuel" }, { number: 11, name: "1 Reis" }, { number: 12, name: "2 Reis" },
    { number: 13, name: "1 Crônicas" }, { number: 14, name: "2 Crônicas" }, { number: 15, name: "Esdras" },
    { number: 16, name: "Neemias" }, { number: 17, name: "Ester" }, { number: 18, name: "Jó" },
    { number: 19, name: "Salmos" }, { number: 20, name: "Provérbios" }, { number: 21, name: "Eclesiastes" },
    { number: 22, name: "Cantares" }, { number: 23, name: "Isaías" }, { number: 24, name: "Jeremias" },
    { number: 25, name: "Lamentações" }, { number: 26, name: "Ezequiel" }, { number: 27, name: "Daniel" },
    { number: 28, name: "Oseias" }, { number: 29, name: "Joel" }, { number: 30, name: "Amós" },
    { number: 31, name: "Obadias" }, { number: 32, name: "Jonas" }, { number: 33, name: "Miquéias" },
    { number: 34, name: "Naum" }, { number: 35, name: "Habacuque" }, { number: 36, name: "Sofonias" },
    { number: 37, name: "Ageu" }, { number: 38, name: "Zacarias" }, { number: 39, name: "Malaquias" },
    { number: 40, name: "Mateus" }, { number: 41, name: "Marcos" }, { number: 42, name: "Lucas" },
    { number: 43, name: "João" }, { number: 44, name: "Atos" }, { number: 45, name: "Romanos" },
    { number: 46, name: "1 Coríntios" }, { number: 47, name: "2 Coríntios" }, { number: 48, name: "Gálatas" },
    { number: 49, name: "Efésios" }, { number: 50, name: "Filipenses" }, { number: 51, name: "Colossenses" },
    { number: 52, name: "1 Tessalonicenses" }, { number: 53, name: "2 Tessalonicenses" },
    { number: 54, name: "1 Timóteo" }, { number: 55, name: "2 Timóteo" }, { number: 56, name: "Tito" },
    { number: 57, name: "Filêmon" }, { number: 58, name: "Hebreus" }, { number: 59, name: "Tiago" },
    { number: 60, name: "1 Pedro" }, { number: 61, name: "2 Pedro" }, { number: 62, name: "1 João" },
    { number: 63, name: "2 João" }, { number: 64, name: "3 João" }, { number: 65, name: "Judas" },
    { number: 66, name: "Apocalipse" }
  ];

  for (const filename of orderedFiles) {
    const entry = zipEntries.find(e => e.entryName === `OEBPS/${filename}`);
    if (!entry) continue;

    const html = entry.getData().toString("utf8");
    const root = parse(html);

    // Look for book name in navigation link: <a href="biblebooknav.xhtml">Gênesis</a>
    const bookNav = root.querySelector("a[href='biblebooknav.xhtml']");
    if (bookNav) {
      const parsedBookName = bookNav.text.trim();
      const matchedBook = BIBLE_BOOKS.find(b => b.name === parsedBookName || parsedBookName.includes(b.name));
      if (matchedBook) {
        currentBookNumber = matchedBook.number;
        currentBookName = matchedBook.name;
        console.log(`Processing Book: ${currentBookName} (${currentBookNumber})`);
      }
    }

    if (currentBookNumber === 0) continue; // Skip front matter

    // Find all verses in this file
    // The EPUB structure often has a <p> containing multiple verses. We need to iterate child nodes.
    const pTags = root.querySelectorAll("p");
    
    for (const p of pTags) {
      // Fast check if p contains any chapter spans
      if (!p.innerHTML.includes("id=\"chapter")) continue;
      
      let currentChapter = 0;
      let currentVerse = 0;
      let currentVerseText = "";

      // Iterate through child nodes of the <p>
      for (const node of p.childNodes) {
        // If it's an element node
        if (node.nodeType === 1) { // 1 = Element
          const el = node as any;
          const id = el.getAttribute("id");
          
          if (id && id.startsWith("chapter")) {
            // e.g. "chapter2_verse1"
            const match = id.match(/chapter(\d+)_verse(\d+)/);
            if (match) {
              // Save previous verse if we have one
              if (currentVerse > 0 && currentVerseText.trim().length > 0) {
                versesBuffer.push({
                  book_number: currentBookNumber,
                  book_name: currentBookName,
                  chapter: currentChapter,
                  verse: currentVerse,
                  text: currentVerseText.trim()
                });
              }
              
              currentChapter = parseInt(match[1]);
              currentVerse = parseInt(match[2]);
              currentVerseText = "";
              continue; // Skip the span itself
            }
          }
          
          // Skip footnote links and verse numbers (strong > sup)
          if (el.tagName === "A" && el.getAttribute("epub:type") === "noteref") continue;
          if (el.tagName === "STRONG" && el.querySelector("sup")) continue;
          if (el.getAttribute("id") && el.getAttribute("id").startsWith("footnotesource")) continue;
          
          // Append text of this element
          if (currentVerse > 0) {
            currentVerseText += el.text;
          }
        } 
        // If it's a text node
        else if (node.nodeType === 3) { // 3 = Text
          if (currentVerse > 0) {
            currentVerseText += (node as any).text;
          }
        }
      }
      
      // Save the last verse in this <p>
      if (currentVerse > 0 && currentVerseText.trim().length > 0) {
        versesBuffer.push({
          book_number: currentBookNumber,
          book_name: currentBookName,
          chapter: currentChapter,
          verse: currentVerse,
          text: currentVerseText.trim().replace(/\s+/g, ' ') // clean up whitespace
        });
      }
    }
  }

  console.log(`Extracted ${versesBuffer.length} verses.`);
  
  if (versesBuffer.length > 0) {
    console.log("Inserting into Supabase (in chunks of 1000)...");
    
    // Clear table first
    await supabase.from('bible_verses').delete().neq('id', 0);
    
    // Insert in chunks
    const chunkSize = 1000;
    for (let i = 0; i < versesBuffer.length; i += chunkSize) {
      const chunk = versesBuffer.slice(i, i + chunkSize);
      const { error } = await supabase.from('bible_verses').insert(chunk);
      if (error) {
        console.error("Error inserting chunk:", error);
      } else {
        console.log(`Inserted chunk ${i / chunkSize + 1} / ${Math.ceil(versesBuffer.length / chunkSize)}`);
      }
    }
    
    console.log("Done!");
  }
}

importBible().catch(console.error);
