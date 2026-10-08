export interface RegionalHerbInfo {
  canonicalLocalName: string; // Exact match to DB localName
  scientificName: string;
  english: string;
  tagalog: string;
  cebuano: string;
  ilocano: string;
  bikol: string;
  hiligaynon?: string;
  otherDialects?: string;
  stuartUrl?: string;
}

export const REGIONAL_HERB_REGISTRY: Record<string, RegionalHerbInfo> = {
  "abutilonindicum": {
    "canonicalLocalName": "Abutilon indicum",
    "scientificName": "Abutilon indicum",
    "english": "Indian Mallow, Country Mallow",
    "tagalog": "Malvas, Kuakuakohan",
    "cebuano": "Malbas, Dalupang",
    "ilocano": "Luplupit, Taratakop",
    "bikol": "Dulupang",
    "hiligaynon": "Malbas",
    "otherDialects": "Gilingita (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Malbas.html"
  },
  "akapulko": {
    "canonicalLocalName": "Akapulko",
    "scientificName": "Senna alata",
    "english": "Ringworm Bush, Candle Bush",
    "tagalog": "Akapulko, Katanda",
    "cebuano": "Katanduk, Sunting, Palochina",
    "ilocano": "Andadasi, Andadasi-dakkel",
    "bikol": "Bayabas-bayabasan",
    "hiligaynon": "Kasitas, Katanduk",
    "otherDialects": "Pakagonkon (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/Akapulko.html"
  },
  "alibangbang": {
    "canonicalLocalName": "Alibangbang",
    "scientificName": "Piliostigma malabaricum",
    "english": "Malabar Orchid Tree",
    "tagalog": "Alibangbang",
    "cebuano": "Alambangbang",
    "ilocano": "Balisbik, Kalibangbang",
    "bikol": "Alibangbang",
    "hiligaynon": "Alibangbang",
    "otherDialects": "Kulibangbang (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Alibangbang.html"
  },
  "ampalaya": {
    "canonicalLocalName": "Ampalaya",
    "scientificName": "Momordica charantia",
    "english": "Bitter Melon, Bitter Gourd",
    "tagalog": "Ampalaya, Margoso",
    "cebuano": "Paliya, Palia",
    "ilocano": "Pariya, Paria",
    "bikol": "Paria, Pariu",
    "hiligaynon": "Palia, Amargoso",
    "otherDialects": "Apalia (Pamp.), Apape (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Ampalaya.html"
  },
  "anonas": {
    "canonicalLocalName": "Anonas",
    "scientificName": "Annona reticulata",
    "english": "Custard Apple, Bullock's Heart",
    "tagalog": "Anonas",
    "cebuano": "Anonas",
    "ilocano": "Anonas",
    "bikol": "Anonas",
    "hiligaynon": "Anonas",
    "otherDialects": "Sariwaya (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Anonas.html"
  },
  "aratiles": {
    "canonicalLocalName": "Aratiles",
    "scientificName": "Muntingia calabura",
    "english": "Jamaica Cherry, Cotton Candy Berry",
    "tagalog": "Aratiles, Datiles",
    "cebuano": "Mansanitas, Manzanitas",
    "ilocano": "Zanitas, Ceresas",
    "bikol": "Aratiles",
    "hiligaynon": "Mansanitas",
    "otherDialects": "Dares (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Aratiles.html"
  },
  "asana": {
    "canonicalLocalName": "Asana",
    "scientificName": "Pterocarpus indicus",
    "english": "Narra Tree, Red Sandalwood",
    "tagalog": "Narra, Asana",
    "cebuano": "Narra, Asana, Nega",
    "ilocano": "Narra",
    "bikol": "Naga",
    "hiligaynon": "Narra",
    "otherDialects": "Daitan (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Narra.html"
  },
  "atis": {
    "canonicalLocalName": "Atis",
    "scientificName": "Annona squamosa",
    "english": "Sugar Apple, Sweetsop",
    "tagalog": "Atis",
    "cebuano": "Atis",
    "ilocano": "Atis",
    "bikol": "Atis",
    "hiligaynon": "Atis",
    "otherDialects": "Yate (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Atis.html"
  },
  "atsuete": {
    "canonicalLocalName": "Atsuete",
    "scientificName": "Bixa orellana",
    "english": "Annatto, Lipstick Tree",
    "tagalog": "Atsuete, Achuete",
    "cebuano": "Achiote, Natin, Suwiti",
    "ilocano": "Atsuete, Asuete",
    "bikol": "Atsuete",
    "hiligaynon": "Achiote",
    "otherDialects": "Chanang (Sul.), Soté (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Achuete.html"
  },
  "ayapana": {
    "canonicalLocalName": "Ayapana",
    "scientificName": "Ayapana triplinervis",
    "english": "Ayapana Tea, Water Hemp",
    "tagalog": "Ayapana",
    "cebuano": "Ayapana",
    "ilocano": "Ayapana",
    "bikol": "Ayapana",
    "hiligaynon": "Ayapana",
    "otherDialects": "Aiapana (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Ayapana.html"
  },
  "balanay": {
    "canonicalLocalName": "Balanay",
    "scientificName": "Ocimum tenuiflorum",
    "english": "Holy Basil, Tulsi",
    "tagalog": "Sulasi, Balanoy",
    "cebuano": "Balanay, Sulasi",
    "ilocano": "Bidai",
    "bikol": "Kamange",
    "hiligaynon": "Balanay",
    "otherDialects": "Loko-loko (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Sulasi.html"
  },
  "balibago": {
    "canonicalLocalName": "Balibago",
    "scientificName": "Hibiscus tiliaceus",
    "english": "Sea Hibiscus, Beach Hibiscus",
    "tagalog": "Balibago",
    "cebuano": "Balibago, Ragindi",
    "ilocano": "Bago",
    "bikol": "Malabago",
    "hiligaynon": "Balibago",
    "otherDialects": "Malabago (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Balibago.html"
  },
  "balimbing": {
    "canonicalLocalName": "Balimbing",
    "scientificName": "Averrhoa carambola",
    "english": "Star Fruit, Carambola",
    "tagalog": "Balimbing",
    "cebuano": "Balimbing, Galangan",
    "ilocano": "Daligan",
    "bikol": "Balimbing",
    "hiligaynon": "Balimbing",
    "otherDialects": "Garahan (Bis. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Balimbing.html"
  },
  "bankundo": {
    "canonicalLocalName": "Bankundo",
    "scientificName": "Morinda citrifolia",
    "english": "Noni, Indian Mulberry",
    "tagalog": "Bankundo, Nino, Apatot",
    "cebuano": "Bankundo, Apatot",
    "ilocano": "Apatot",
    "bikol": "Bangkoro",
    "hiligaynon": "Bankundo",
    "otherDialects": "Nino (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Apatot.html"
  },
  "bawang": {
    "canonicalLocalName": "Bawang",
    "scientificName": "Allium sativum",
    "english": "Garlic",
    "tagalog": "Bawang, Bauang",
    "cebuano": "Ahos",
    "ilocano": "Bawsing, Lasona",
    "bikol": "Bawang, Ahos",
    "hiligaynon": "Ahos",
    "otherDialects": "Ganding (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Bawang.html"
  },
  "bayabas": {
    "canonicalLocalName": "Bayabas",
    "scientificName": "Psidium guajava",
    "english": "Guava",
    "tagalog": "Bayabas, Kalimbahin",
    "cebuano": "Bayabas",
    "ilocano": "Bayawas",
    "bikol": "Bayawas",
    "hiligaynon": "Bayabas",
    "otherDialects": "Biabas (Sul.), Gaiyabat (If.)",
    "stuartUrl": "https://www.stuartxchange.org/Bayabas.html"
  },
  "bottlegourd": {
    "canonicalLocalName": "Bottle gourd",
    "scientificName": "Lagenaria siceraria",
    "english": "Bottle Gourd, Calabash",
    "tagalog": "Upo",
    "cebuano": "Upo, Sikay",
    "ilocano": "Tabungaw",
    "bikol": "Upo",
    "hiligaynon": "Upo",
    "otherDialects": "Bagang (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Upo.html"
  },
  "butterflypea": {
    "canonicalLocalName": "Butterfly pea",
    "scientificName": "Clitoria ternatea",
    "english": "Butterfly Pea, Blue Pea",
    "tagalog": "Kolokanting, Pukingan",
    "cebuano": "Pukingan, Kolokanting",
    "ilocano": "Sam-sam-ping, Puki-reyna",
    "bikol": "Kolokanting",
    "hiligaynon": "Pukingan",
    "otherDialects": "Balog-balog (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/ButterflyPea.html"
  },
  "cacao": {
    "canonicalLocalName": "Cacao",
    "scientificName": "Theobroma cacao",
    "english": "Cacao, Cocoa Tree",
    "tagalog": "Kakaw, Cacao",
    "cebuano": "Kakaw",
    "ilocano": "Kakaw",
    "bikol": "Kakaw",
    "hiligaynon": "Kakaw",
    "otherDialects": "Cacau (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Cacao.html"
  },
  "chico": {
    "canonicalLocalName": "Chico",
    "scientificName": "Manilkara zapota",
    "english": "Sapodilla, Chiku",
    "tagalog": "Tsiko, Chico",
    "cebuano": "Tsiko, Siko",
    "ilocano": "Tsiko",
    "bikol": "Tsiko",
    "hiligaynon": "Tsiko",
    "otherDialects": "Chico (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Chico.html"
  },
  "coffee": {
    "canonicalLocalName": "Coffee",
    "scientificName": "Coffea arabica",
    "english": "Arabian Coffee",
    "tagalog": "Kape",
    "cebuano": "Kape",
    "ilocano": "Kape",
    "bikol": "Kape",
    "hiligaynon": "Kape",
    "otherDialects": "Kafe (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Kape.html"
  },
  "damongmaria": {
    "canonicalLocalName": "Damong Maria",
    "scientificName": "Artemisia vulgaris",
    "english": "Mugwort, Maidenwort",
    "tagalog": "Damong Maria, Kamaria",
    "cebuano": "Gilbas, Hilbas",
    "ilocano": "Arbaaka, Erbaaka",
    "bikol": "Damong Maria",
    "hiligaynon": "Gilbas",
    "otherDialects": "Erbaca (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/DamongMaria.html"
  },
  "doldol": {
    "canonicalLocalName": "Doldol",
    "scientificName": "Ceiba pentandra",
    "english": "Kapok, Silk-Cotton Tree",
    "tagalog": "Kapok, Bulak",
    "cebuano": "Doldol, Kapok",
    "ilocano": "Kapas-sanglay",
    "bikol": "Doldol",
    "hiligaynon": "Doldol",
    "otherDialects": "Kayu (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Kapok.html"
  },
  "duhat": {
    "canonicalLocalName": "Duhat",
    "scientificName": "Syzygium cumini",
    "english": "Java Plum, Black Plum",
    "tagalog": "Duhat",
    "cebuano": "Lomboy, Lumboy",
    "ilocano": "Lungboy, Dungboy",
    "bikol": "Duhat, Lomboy",
    "hiligaynon": "Lomboy",
    "otherDialects": "Dughat (Kin.)",
    "stuartUrl": "https://www.stuartxchange.org/Duhat.html"
  },
  "fennel": {
    "canonicalLocalName": "Fennel",
    "scientificName": "Foeniculum vulgare",
    "english": "Fennel, Sweet Fennel",
    "tagalog": "Haras, Anis",
    "cebuano": "Harani, Anis",
    "ilocano": "Haras",
    "bikol": "Haras",
    "hiligaynon": "Haras",
    "otherDialects": "Anis (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Haras.html"
  },
  "gabi": {
    "canonicalLocalName": "Gabi",
    "scientificName": "Colocasia esculenta",
    "english": "Taro, Elephant Ear",
    "tagalog": "Gabi, Gandus",
    "cebuano": "Karlang, Gaway-gaway",
    "ilocano": "Aba, Aba-aba",
    "bikol": "Gabi, Dagmay, Natong",
    "hiligaynon": "Gabi, Dagmay",
    "otherDialects": "Lagway (War.)",
    "stuartUrl": "https://www.stuartxchange.org/Gabi.html"
  },
  "granada": {
    "canonicalLocalName": "Granada",
    "scientificName": "Punica granatum",
    "english": "Pomegranate",
    "tagalog": "Granada",
    "cebuano": "Granada",
    "ilocano": "Granada",
    "bikol": "Granada",
    "hiligaynon": "Granada",
    "otherDialects": "Dalima (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Granada.html"
  },
  "gumamela": {
    "canonicalLocalName": "Gumamela",
    "scientificName": "Hibiscus rosa-sinensis",
    "english": "China Rose, Hibiscus",
    "tagalog": "Gumamela",
    "cebuano": "Antolanga, Kayanga",
    "ilocano": "Tarokanga, Kayanga",
    "bikol": "Gumamela, Kayanga",
    "hiligaynon": "Tapulanga, Antolanga",
    "otherDialects": "Arotangan (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/Gumamela.html"
  },
  "indianheliotrope": {
    "canonicalLocalName": "Indian Heliotrope",
    "scientificName": "Heliotropium indicum",
    "english": "Indian Heliotrope, Turnsole",
    "tagalog": "Hinlalayon, Trompa ng Elepante",
    "cebuano": "Hinlalayon, Kamo-kamo",
    "ilocano": "Elk-elko, Pengka-pengka",
    "bikol": "Trompa elepante",
    "hiligaynon": "Kamo-kamo",
    "otherDialects": "Malatukod (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/TrompaElepante.html"
  },
  "kabiki": {
    "canonicalLocalName": "Kabiki",
    "scientificName": "Mimusops elengi",
    "english": "Spanish Cherry, Bullet Wood",
    "tagalog": "Kabiki",
    "cebuano": "Kabiki",
    "ilocano": "Kabiki",
    "bikol": "Kabiki",
    "hiligaynon": "Kabiki",
    "otherDialects": "Bansalagin (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Kabiki.html"
  },
  "kahel": {
    "canonicalLocalName": "Kahel",
    "scientificName": "Citrus aurantium",
    "english": "Bitter Orange, Seville Orange",
    "tagalog": "Kahel, Dalandan",
    "cebuano": "Kahel, Kolobot",
    "ilocano": "Kahel",
    "bikol": "Kahel",
    "hiligaynon": "Kahel",
    "otherDialects": "Kolobot (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Kahel.html"
  },
  "kalingag": {
    "canonicalLocalName": "Kalingag",
    "scientificName": "Cinnamomum mercadoi",
    "english": "Philippine Cinnamon",
    "tagalog": "Kalingag, Samiling",
    "cebuano": "Kaningag, Kalingag",
    "ilocano": "Kasiu, Kalingag",
    "bikol": "Canela, Kalingag",
    "hiligaynon": "Kaningag",
    "otherDialects": "Maragao (Mar.)",
    "stuartUrl": "https://www.stuartxchange.org/Kalingag.html"
  },
  "kalumpang": {
    "canonicalLocalName": "Kalumpang",
    "scientificName": "Sterculia foetida",
    "english": "Java Olive, Wild Almond",
    "tagalog": "Kalumpang",
    "cebuano": "Kalumpang, Bangad",
    "ilocano": "Bangar",
    "bikol": "Kalumpang",
    "hiligaynon": "Kalumpang",
    "otherDialects": "Bobog (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Kalumpang.html"
  },
  "kamias": {
    "canonicalLocalName": "Kamias",
    "scientificName": "Averrhoa bilimbi",
    "english": "Bilimbi, Cucumber Tree",
    "tagalog": "Kamias, Kalamyas",
    "cebuano": "Iba, Kalingi",
    "ilocano": "Pias",
    "bikol": "Iba",
    "hiligaynon": "Iba",
    "otherDialects": "Kolonanas (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Kamias.html"
  },
  "kamote": {
    "canonicalLocalName": "Kamote",
    "scientificName": "Ipomoea batatas",
    "english": "Sweet Potato",
    "tagalog": "Kamote",
    "cebuano": "Kamote",
    "ilocano": "Kamote",
    "bikol": "Kamote",
    "hiligaynon": "Kamote",
    "otherDialects": "Lapni (If.), Lokto (Igorot)",
    "stuartUrl": "https://www.stuartxchange.org/Kamote.html"
  },
  "kastuli": {
    "canonicalLocalName": "Kastuli",
    "scientificName": "Abelmoschus moschatus",
    "english": "Musk Mallow, Ambrette",
    "tagalog": "Kastuli",
    "cebuano": "Kastuli, Dalupang",
    "ilocano": "Kastuli",
    "bikol": "Kastuli",
    "hiligaynon": "Kastuli",
    "otherDialects": "Marikum (Bis.)",
    "stuartUrl": "https://www.stuartxchange.org/Kastuli.html"
  },
  "kasuy": {
    "canonicalLocalName": "Kasuy",
    "scientificName": "Anacardium occidentale",
    "english": "Cashew Nut, Cashew Apple",
    "tagalog": "Kasuy, Kasoy",
    "cebuano": "Kasoy",
    "ilocano": "Kasoy",
    "bikol": "Kasoy",
    "hiligaynon": "Kasoy",
    "otherDialects": "Balubad (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Kasuy.html"
  },
  "katakataka": {
    "canonicalLocalName": "Katakataka",
    "scientificName": "Kalanchoe pinnata",
    "english": "Miracle Leaf, Cathedral Bells",
    "tagalog": "Katakataka",
    "cebuano": "Maritana, Abaniko, Hito-hito",
    "ilocano": "Katakataka, Siempre viva",
    "bikol": "Karitana",
    "hiligaynon": "Maritana",
    "otherDialects": "Ditana (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Katakataka.html"
  },
  "katuray": {
    "canonicalLocalName": "Katuray",
    "scientificName": "Sesbania grandiflora",
    "english": "Vegetable Hummingbird, Agati",
    "tagalog": "Katuray",
    "cebuano": "Katuray, Gaway-gaway",
    "ilocano": "Katuday",
    "bikol": "Katuray",
    "hiligaynon": "Gaway-gaway",
    "otherDialects": "Diana (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Katuray.html"
  },
  "kupang": {
    "canonicalLocalName": "Kupang",
    "scientificName": "Parkia timoriana",
    "english": "Tree Bean, Timor Parkia",
    "tagalog": "Kupang",
    "cebuano": "Kupang",
    "ilocano": "Kupang",
    "bikol": "Kupang",
    "hiligaynon": "Kupang",
    "otherDialects": "Amarang (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Kupang.html"
  },
  "lagundi": {
    "canonicalLocalName": "Lagundi",
    "scientificName": "Vitex negundo",
    "english": "Five-leaved Chaste Tree",
    "tagalog": "Lagundi, Kamalan",
    "cebuano": "Dangla, Lagundi, Turagay",
    "ilocano": "Dangla, Limo-limo",
    "bikol": "Dangla, Agno-casto",
    "hiligaynon": "Lagundi",
    "otherDialects": "Dabtan (If.), Gei (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Lagundi.html"
  },
  "langka": {
    "canonicalLocalName": "Langka",
    "scientificName": "Artocarpus heterophyllus",
    "english": "Jackfruit",
    "tagalog": "Langka, Nangka",
    "cebuano": "Nangka, Lanka",
    "ilocano": "Langka",
    "bikol": "Langka",
    "hiligaynon": "Nangka",
    "otherDialects": "Anangka (Ilk. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Langka.html"
  },
  "linga": {
    "canonicalLocalName": "Linga",
    "scientificName": "Sesamum indicum",
    "english": "Sesame, Gingelly",
    "tagalog": "Linga",
    "cebuano": "Linga",
    "ilocano": "Lenga",
    "bikol": "Linga",
    "hiligaynon": "Linga",
    "otherDialects": "Langis (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/Linga.html"
  },
  "lokoloko": {
    "canonicalLocalName": "Lokoloko",
    "scientificName": "Ocimum gratissimum",
    "english": "Clove Basil, African Basil",
    "tagalog": "Lokoloko",
    "cebuano": "Lokoloko, Kalo-kalo",
    "ilocano": "Loko-loko",
    "bikol": "Lokoloko",
    "hiligaynon": "Lokoloko",
    "otherDialects": "Kolon-kogon (Bis.)",
    "stuartUrl": "https://www.stuartxchange.org/Lokoloko.html"
  },
  "luffaaegyptiaca": {
    "canonicalLocalName": "Luffa aegyptiaca",
    "scientificName": "Luffa aegyptiaca",
    "english": "Sponge Gourd, Smooth Loofah",
    "tagalog": "Patola",
    "cebuano": "Patola, Kabatiti",
    "ilocano": "Kabatiti",
    "bikol": "Patola",
    "hiligaynon": "Patola",
    "otherDialects": "Salag-salag (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Patola.html"
  },
  "luya": {
    "canonicalLocalName": "Luya",
    "scientificName": "Zingiber officinale",
    "english": "Ginger",
    "tagalog": "Luya",
    "cebuano": "Luy-a",
    "ilocano": "Laya",
    "bikol": "Luy-a",
    "hiligaynon": "Luy-a",
    "otherDialects": "Baseng (Ilk.), Gome (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Luya.html"
  },
  "luyangdilaw": {
    "canonicalLocalName": "Luyang dilaw",
    "scientificName": "Curcuma longa",
    "english": "Turmeric, Yellow Ginger",
    "tagalog": "Luyang Dilaw, Dilaw",
    "cebuano": "Dulaw, Kalawag, Talaw",
    "ilocano": "Kunig",
    "bikol": "Dilaw, Kalawag",
    "hiligaynon": "Dulaw",
    "otherDialects": "Kalabaga (Bis./Man.), Pangas (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/Dilaw.html"
  },
  "mabolo": {
    "canonicalLocalName": "Mabolo",
    "scientificName": "Diospyros blancoi",
    "english": "Velvet Apple, Mabolo",
    "tagalog": "Mabolo, Kamagong",
    "cebuano": "Kamagong, Talang",
    "ilocano": "Kamagong, Mabolo",
    "bikol": "Mabolo",
    "hiligaynon": "Kamagong",
    "otherDialects": "Amaga (Tagbanua)",
    "stuartUrl": "https://www.stuartxchange.org/Mabolo.html"
  },
  "maize": {
    "canonicalLocalName": "Maize",
    "scientificName": "Zea mays",
    "english": "Corn, Maize",
    "tagalog": "Mais",
    "cebuano": "Mais",
    "ilocano": "Mais",
    "bikol": "Mais",
    "hiligaynon": "Mais",
    "otherDialects": "Borona (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/Mais.html"
  },
  "makabuhay": {
    "canonicalLocalName": "Makabuhay",
    "scientificName": "Tinospora crispa",
    "english": "Heavenly Elixir, Bitter Grape",
    "tagalog": "Makabuhay",
    "cebuano": "Panyawan, Paliaban",
    "ilocano": "Pangiawan, Makabuhay",
    "bikol": "Makabuhay",
    "hiligaynon": "Panyawan",
    "otherDialects": "Manungal (Bis. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Makabuhay.html"
  },
  "malunggay": {
    "canonicalLocalName": "Malunggay",
    "scientificName": "Moringa oleifera",
    "english": "Moringa, Drumstick Tree",
    "tagalog": "Malunggay",
    "cebuano": "Kamalunggay, Kalunggay",
    "ilocano": "Marunggay",
    "bikol": "Malunggay",
    "hiligaynon": "Balunggay, Kamalunggay",
    "otherDialects": "Dool (Pamp.), Arunggay (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Malunggay.html"
  },
  "mangga": {
    "canonicalLocalName": "Mangga",
    "scientificName": "Mangifera indica",
    "english": "Mango",
    "tagalog": "Mangga",
    "cebuano": "Paho, Mangga",
    "ilocano": "Manga",
    "bikol": "Manga",
    "hiligaynon": "Paho, Mangga",
    "otherDialects": "Pao (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Mangga.html"
  },
  "mangosteen": {
    "canonicalLocalName": "Mangosteen",
    "scientificName": "Garcinia mangostana",
    "english": "Mangosteen, Queen of Fruits",
    "tagalog": "Mangostan, Mangosteen",
    "cebuano": "Mangostan",
    "ilocano": "Mangostan",
    "bikol": "Mangostan",
    "hiligaynon": "Mangostan",
    "otherDialects": "Manggis (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Mangostan.html"
  },
  "manzanitas": {
    "canonicalLocalName": "Manzanitas",
    "scientificName": "Ziziphus mauritiana",
    "english": "Indian Jujube, Chinese Date",
    "tagalog": "Manzanitas",
    "cebuano": "Mansanitas",
    "ilocano": "Zanitas",
    "bikol": "Manzanitas",
    "hiligaynon": "Mansanitas",
    "otherDialects": "Diklap (Ilk.)",
    "stuartUrl": "https://www.stuartxchange.org/Manzanitas.html"
  },
  "mayana": {
    "canonicalLocalName": "Mayana",
    "scientificName": "Coleus scutellarioides",
    "english": "Coleus, Painted Nettle",
    "tagalog": "Mayana",
    "cebuano": "Lampunaya, Mayana, Daponaya",
    "ilocano": "Sapiro, Maliana",
    "bikol": "Mayana",
    "hiligaynon": "Lampunaya",
    "otherDialects": "Badayang (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Mayana.html"
  },
  "mustasa": {
    "canonicalLocalName": "Mustasa",
    "scientificName": "Brassica juncea",
    "english": "Mustard Greens, Indian Mustard",
    "tagalog": "Mustasa",
    "cebuano": "Mustasa",
    "ilocano": "Mustasa",
    "bikol": "Mustasa",
    "hiligaynon": "Mustasa",
    "otherDialects": "Mostaza (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Mustasa.html"
  },
  "niog": {
    "canonicalLocalName": "Niog",
    "scientificName": "Cocos nucifera",
    "english": "Coconut Tree",
    "tagalog": "Niyog, Niog",
    "cebuano": "Lubi",
    "ilocano": "Niog",
    "bikol": "Niyog",
    "hiligaynon": "Lubi",
    "otherDialects": "Ongot (Chamorro/Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Niog.html"
  },
  "nipa": {
    "canonicalLocalName": "Nipa",
    "scientificName": "Nypa fruticans",
    "english": "Nipa Palm, Mangrove Palm",
    "tagalog": "Nipa, Sasa",
    "cebuano": "Nipa, Sasa",
    "ilocano": "Nipa",
    "bikol": "Nipa",
    "hiligaynon": "Nipa",
    "otherDialects": "Pinok (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Nipa.html"
  },
  "niyogniyogan": {
    "canonicalLocalName": "Niyog-niyogan",
    "scientificName": "Combretum indicum",
    "english": "Chinese Honeysuckle, Rangoon Creeper",
    "tagalog": "Niyog-niyogan, Niog-niogan",
    "cebuano": "Balitadham, Tartaraok",
    "ilocano": "Babebabe, Balitambal",
    "bikol": "Bawe-bawe",
    "hiligaynon": "Balitadham",
    "otherDialects": "Kasunbal (Bon.), Pinio (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Niog-niogan.html"
  },
  "okra": {
    "canonicalLocalName": "Okra",
    "scientificName": "Abelmoschus esculentus",
    "english": "Lady's Finger, Okra, Gumbo",
    "tagalog": "Okra",
    "cebuano": "Okra",
    "ilocano": "Okra",
    "bikol": "Okra",
    "hiligaynon": "Okra",
    "otherDialects": "Gumbo",
    "stuartUrl": "https://www.stuartxchange.org/Okra.html"
  },
  "olasiman": {
    "canonicalLocalName": "Olasiman",
    "scientificName": "Portulaca oleracea",
    "english": "Purslane, Little Hogweed",
    "tagalog": "Olasiman, Gulasiman",
    "cebuano": "Alusiman, Gulasiman",
    "ilocano": "Ngalug",
    "bikol": "Gulasiman",
    "hiligaynon": "Alusiman",
    "otherDialects": "Dup-dupil (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Gulasiman.html"
  },
  "oregano": {
    "canonicalLocalName": "Oregano",
    "scientificName": "Coleus amboinicus",
    "english": "Mexican Mint, Cuban Oregano",
    "tagalog": "Oregano, Suganda",
    "cebuano": "Kalabo, Suganda, Torongil",
    "ilocano": "Suganda, Oregano",
    "bikol": "Oregano",
    "hiligaynon": "Kalabo",
    "otherDialects": "Bilagoh (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Oregano.html"
  },
  "oxaliscorniculata": {
    "canonicalLocalName": "Oxalis corniculata",
    "scientificName": "Oxalis corniculata",
    "english": "Creeping Woodsorrel",
    "tagalog": "Taingang-daga, Susocayohan",
    "cebuano": "Koto-koto, Taingang-daga",
    "ilocano": "Marasiksik, Salamagi",
    "bikol": "Taingang-daga",
    "hiligaynon": "Koto-koto",
    "otherDialects": "Picho-picho (Bis.)",
    "stuartUrl": "https://www.stuartxchange.org/TaingangDaga.html"
  },
  "paminta": {
    "canonicalLocalName": "Paminta",
    "scientificName": "Piper nigrum",
    "english": "Black Pepper, White Pepper",
    "tagalog": "Paminta, Pimienta",
    "cebuano": "Paminta, Pimienta",
    "ilocano": "Paminta",
    "bikol": "Paminta",
    "hiligaynon": "Paminta",
    "otherDialects": "Malisa (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Paminta.html"
  },
  "pandan": {
    "canonicalLocalName": "Pandan",
    "scientificName": "Pandanus amaryllifolius",
    "english": "Fragrant Pandan, Screwpine",
    "tagalog": "Pandan, Pandan-mabango",
    "cebuano": "Pandan, Pandan-mabango",
    "ilocano": "Pandan",
    "bikol": "Pandan",
    "hiligaynon": "Pandan",
    "otherDialects": "Pangdan (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/PandanMabango.html"
  },
  "papaya": {
    "canonicalLocalName": "Papaya",
    "scientificName": "Carica papaya",
    "english": "Papaya, Pawpaw",
    "tagalog": "Papaya",
    "cebuano": "Kapayas",
    "ilocano": "Papaya",
    "bikol": "Papaya",
    "hiligaynon": "Kapayas",
    "otherDialects": "Tapayas (Bon.)",
    "stuartUrl": "https://www.stuartxchange.org/Papaya.html"
  },
  "radish": {
    "canonicalLocalName": "Radish",
    "scientificName": "Raphanus sativus",
    "english": "Radish, Daikon",
    "tagalog": "Labanos, Rabanos",
    "cebuano": "Rabanos, Labanos",
    "ilocano": "Rabanos",
    "bikol": "Labanos",
    "hiligaynon": "Rabanos",
    "otherDialects": "Rabanos (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Labanos.html"
  },
  "romero": {
    "canonicalLocalName": "Romero",
    "scientificName": "Salvia rosmarinus",
    "english": "Rosemary",
    "tagalog": "Romero",
    "cebuano": "Romero",
    "ilocano": "Romero",
    "bikol": "Romero",
    "hiligaynon": "Romero",
    "otherDialects": "Romero (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/Romero.html"
  },
  "sabila": {
    "canonicalLocalName": "Sabila",
    "scientificName": "Aloe vera",
    "english": "Aloe Vera, Medicinal Aloe",
    "tagalog": "Sabila, Sabila-pinya",
    "cebuano": "Sabila, Dilang buwaya",
    "ilocano": "Sabila",
    "bikol": "Sabila",
    "hiligaynon": "Sabila",
    "otherDialects": "Dilang-halo (Bis. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Sabila.html"
  },
  "saluyot": {
    "canonicalLocalName": "Saluyot",
    "scientificName": "Corchorus aestuans",
    "english": "Jute Mallow, Bush Okra",
    "tagalog": "Saluyot",
    "cebuano": "Tagabang, Tugbang",
    "ilocano": "Saluyot",
    "bikol": "Saluyot",
    "hiligaynon": "Tagabang",
    "otherDialects": "Pasau-na-bilog (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Saluyot.html"
  },
  "sambong": {
    "canonicalLocalName": "Sambong",
    "scientificName": "Blumea balsamifera",
    "english": "Blumea Camphor, Ngai Camphor",
    "tagalog": "Sambong",
    "cebuano": "Alibhon, Gabuen, Alimon",
    "ilocano": "Sob-sob, Subusub, Subsob",
    "bikol": "Sambong",
    "hiligaynon": "Alibhon, Lalakdan",
    "otherDialects": "Sambun (Sul.), Kaliban (Tagbanua)",
    "stuartUrl": "https://www.stuartxchange.org/Sambong.html"
  },
  "sampaguita": {
    "canonicalLocalName": "Sampaguita",
    "scientificName": "Jasminum sambac",
    "english": "Arabian Jasmine, Sampaguita",
    "tagalog": "Sampaguita",
    "cebuano": "Sampaguita, Manul",
    "ilocano": "Kampopot",
    "bikol": "Sampaguita",
    "hiligaynon": "Manul",
    "otherDialects": "Hubar (Sul.)",
    "stuartUrl": "https://www.stuartxchange.org/Sampaguita.html"
  },
  "sampalok": {
    "canonicalLocalName": "Sampalok",
    "scientificName": "Tamarindus indica",
    "english": "Tamarind",
    "tagalog": "Sampalok, Sambalok",
    "cebuano": "Sambag, Sambak",
    "ilocano": "Salamagi, Salomagi",
    "bikol": "Sampalok",
    "hiligaynon": "Sambag",
    "otherDialects": "Kalamagi (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Sampalok.html"
  },
  "santan": {
    "canonicalLocalName": "Santan",
    "scientificName": "Ixora coccinea",
    "english": "Jungle Flame, Flame of Woods",
    "tagalog": "Santan-pula, Santan",
    "cebuano": "Santan, Tangpupo",
    "ilocano": "Santan",
    "bikol": "Santan",
    "hiligaynon": "Tangpupo",
    "otherDialects": "Asuncion (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Santan.html"
  },
  "santol": {
    "canonicalLocalName": "Santol",
    "scientificName": "Sandoricum koetjape",
    "english": "Cotton Fruit, Santol",
    "tagalog": "Santol",
    "cebuano": "Santol",
    "ilocano": "Santol",
    "bikol": "Santol",
    "hiligaynon": "Santol",
    "otherDialects": "Katul (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/Santol.html"
  },
  "sibuyas": {
    "canonicalLocalName": "Sibuyas",
    "scientificName": "Allium cepa",
    "english": "Onion",
    "tagalog": "Sibuyas, Lasona",
    "cebuano": "Sibuyas, Bumbay",
    "ilocano": "Lasona, Sibuyas",
    "bikol": "Sibuyas",
    "hiligaynon": "Sibuyas, Bumbay",
    "otherDialects": "Lasuna (Ilk. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Sibuyas.html"
  },
  "solasi": {
    "canonicalLocalName": "Solasi",
    "scientificName": "Ocimum basilicum",
    "english": "Sweet Basil, Common Basil",
    "tagalog": "Balanoy, Solasi",
    "cebuano": "Solasi, Balanoy",
    "ilocano": "Samilig",
    "bikol": "Balanoy",
    "hiligaynon": "Balanoy",
    "otherDialects": "Bouak (Bis.)",
    "stuartUrl": "https://www.stuartxchange.org/Balanoy.html"
  },
  "suha": {
    "canonicalLocalName": "Suha",
    "scientificName": "Citrus maxima",
    "english": "Pomelo, Shaddock",
    "tagalog": "Suha, Lukban",
    "cebuano": "Kabugao, Lukban",
    "ilocano": "Suha, Lucban",
    "bikol": "Suha",
    "hiligaynon": "Kabugao",
    "otherDialects": "Tambuyok (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/Suha.html"
  },
  "takipkohol": {
    "canonicalLocalName": "Takip-kohol",
    "scientificName": "Centella asiatica",
    "english": "Gotu Kola, Asiatic Pennywort",
    "tagalog": "Takip-kohol, Tahepbukid",
    "cebuano": "Yahong-yahong",
    "ilocano": "Pano-pano",
    "bikol": "Hagonoy",
    "hiligaynon": "Yahong-yahong",
    "otherDialects": "Paitan-paitan (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/TakipKohol.html"
  },
  "talisay": {
    "canonicalLocalName": "Talisay",
    "scientificName": "Terminalia catappa",
    "english": "Tropical Almond, Sea Almond",
    "tagalog": "Talisay",
    "cebuano": "Talisay",
    "ilocano": "Lugo, Talisay",
    "bikol": "Talisay",
    "hiligaynon": "Talisay",
    "otherDialects": "Banilak (Pamp.), Hitoma (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Talisay.html"
  },
  "tanglad": {
    "canonicalLocalName": "Tanglad",
    "scientificName": "Cymbopogon citratus",
    "english": "Lemongrass",
    "tagalog": "Tanglad",
    "cebuano": "Tanglad, Balioko",
    "ilocano": "Baraniw",
    "bikol": "Tanglad",
    "hiligaynon": "Tanglad",
    "otherDialects": "Salay (Pamp.)",
    "stuartUrl": "https://www.stuartxchange.org/Tanglad.html"
  },
  "thespesiapopulnea": {
    "canonicalLocalName": "Thespesia populnea",
    "scientificName": "Thespesia populnea",
    "english": "Portia Tree, Pacific Rosewood",
    "tagalog": "Banalo, Boboi-gubat",
    "cebuano": "Banalo, Malabago",
    "ilocano": "Bulakan",
    "bikol": "Banalo",
    "hiligaynon": "Banalo",
    "otherDialects": "Valo (Ivatan)",
    "stuartUrl": "https://www.stuartxchange.org/Banalo.html"
  },
  "tsaanggubat": {
    "canonicalLocalName": "Tsaang Gubat",
    "scientificName": "Ehretia microphylla",
    "english": "Wild Tea, Philippine Tea",
    "tagalog": "Tsaang Gubat, Chaang-bundok",
    "cebuano": "Kagidkid, Putputai, Alangit",
    "ilocano": "Itsa, Icha-ti-bakir",
    "bikol": "Putputai",
    "hiligaynon": "Kagidkid, Maragundinas",
    "otherDialects": "Santing (Sul.), Maratia (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Tsaang.html"
  },
  "tsampaka": {
    "canonicalLocalName": "Tsampaka",
    "scientificName": "Magnolia champaca",
    "english": "Champak, Joy Perfume Tree",
    "tagalog": "Tsampaka, Sampakang-pula",
    "cebuano": "Tsampaka, Sampaka",
    "ilocano": "Tsampaka",
    "bikol": "Tsampaka",
    "hiligaynon": "Tsampaka",
    "otherDialects": "Champaca (Spanish-Fil.)",
    "stuartUrl": "https://www.stuartxchange.org/TsampakangPula.html"
  },
  "tubo": {
    "canonicalLocalName": "Tubo",
    "scientificName": "Saccharum officinarum",
    "english": "Sugarcane",
    "tagalog": "Tubo",
    "cebuano": "Tubo",
    "ilocano": "Unas",
    "bikol": "Tubo",
    "hiligaynon": "Tubo",
    "otherDialects": "Agbo (Ibn.)",
    "stuartUrl": "https://www.stuartxchange.org/Tubo.html"
  },
  "ulasimangbato": {
    "canonicalLocalName": "Ulasimang Bato",
    "scientificName": "Peperomia pellucida",
    "english": "Silver Bush, Shiny Bush, Peperomia",
    "tagalog": "Ulasimang Bato, Pansit-pansitan",
    "cebuano": "Sinaw-sinaw, Pansit-pansitan",
    "ilocano": "Lin-linaaw, Ulasiman-bato",
    "bikol": "Lasa",
    "hiligaynon": "Sinaw-sinaw",
    "otherDialects": "Sahica-puti (Tag. alt)",
    "stuartUrl": "https://www.stuartxchange.org/Pansit.html"
  },
  "yerbabuena": {
    "canonicalLocalName": "Yerba Buena",
    "scientificName": "Mentha × villosa",
    "english": "Peppermint, Spearmint, Mint",
    "tagalog": "Yerba Buena, Hierba Buena",
    "cebuano": "Herba Buena, Hilbas",
    "ilocano": "Erba buena",
    "bikol": "Yerba buena",
    "hiligaynon": "Hilbas",
    "otherDialects": "Ablebana (If.)",
    "stuartUrl": "https://www.stuartxchange.org/Yerba.html"
  },
  "ylangylang": {
    "canonicalLocalName": "Ylang-ylang",
    "scientificName": "Cananga odorata",
    "english": "Perfume Tree, Ylang-ylang",
    "tagalog": "Ilang-ilang, Ylang-ylang",
    "cebuano": "Ilang-ilang",
    "ilocano": "Alang-ilang",
    "bikol": "Ilang-ilang",
    "hiligaynon": "Ilang-ilang",
    "otherDialects": "Ngoran (Pang.)",
    "stuartUrl": "https://www.stuartxchange.org/IlangIlang.html"
  }
};

/**
 * Normalizes an herb name or search term for resilient dictionary lookup.
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds all herb canonical local names that match an English or regional search query.
 * Always returns exact database `localName` values for seamless WHERE localName IN (...) queries.
 */
export function findMatchingHerbNames(query: string): string[] {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const matched = new Set<string>();

  for (const [key, info] of Object.entries(REGIONAL_HERB_REGISTRY)) {
    if (
      key.includes(q) ||
      info.canonicalLocalName.toLowerCase().includes(q) ||
      info.scientificName.toLowerCase().includes(q) ||
      info.english.toLowerCase().includes(q) ||
      info.tagalog.toLowerCase().includes(q) ||
      info.cebuano.toLowerCase().includes(q) ||
      info.ilocano.toLowerCase().includes(q) ||
      info.bikol.toLowerCase().includes(q) ||
      (info.hiligaynon && info.hiligaynon.toLowerCase().includes(q)) ||
      (info.otherDialects && info.otherDialects.toLowerCase().includes(q))
    ) {
      matched.add(info.canonicalLocalName);
    }
  }

  return Array.from(matched);
}

/**
 * Retrieves regional names info by botanical or local name.
 */
export function getRegionalInfo(identifier: string): RegionalHerbInfo | null {
  if (!identifier) return null;
  const norm = normalizeKey(identifier);
  
  if (REGIONAL_HERB_REGISTRY[norm]) {
    return REGIONAL_HERB_REGISTRY[norm];
  }

  const lower = identifier.trim().toLowerCase();
  for (const info of Object.values(REGIONAL_HERB_REGISTRY)) {
    if (
      info.canonicalLocalName.toLowerCase() === lower ||
      info.scientificName.toLowerCase() === lower ||
      normalizeKey(info.canonicalLocalName) === norm ||
      normalizeKey(info.scientificName) === norm
    ) {
      return info;
    }
  }

  return null;
}

/**
 * Formats regional names dictionary for UI components.
 */
export function getHerbRegionalNames(herb: { localName?: string; scientificName?: string }): RegionalHerbInfo {
  const info = getRegionalInfo(herb?.localName || '') || getRegionalInfo(herb?.scientificName || '');
  if (info) return info;
  return {
    canonicalLocalName: herb?.localName || 'Herb',
    scientificName: herb?.scientificName || '',
    english: 'Philippine Herbal Plant',
    tagalog: herb?.localName || '',
    cebuano: '—',
    ilocano: '—',
    bikol: '—',
    stuartUrl: ''
  };
}

/**
 * Checks whether an herb matches a search query across any regional linguistic alias.
 */
export function matchesRegionalNames(herb: { localName?: string; scientificName?: string }, query: string): boolean {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  const info = getHerbRegionalNames(herb);
  return (
    info.canonicalLocalName.toLowerCase().includes(q) ||
    info.scientificName.toLowerCase().includes(q) ||
    info.english.toLowerCase().includes(q) ||
    info.tagalog.toLowerCase().includes(q) ||
    info.cebuano.toLowerCase().includes(q) ||
    info.ilocano.toLowerCase().includes(q) ||
    info.bikol.toLowerCase().includes(q) ||
    (info.hiligaynon ? info.hiligaynon.toLowerCase().includes(q) : false) ||
    (info.otherDialects ? info.otherDialects.toLowerCase().includes(q) : false)
  );
}
