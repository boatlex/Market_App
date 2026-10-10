    export const GHANA_REGIONS = [
    "Greater Accra", "Ashanti", "Bono", "Bono East", "Central", "Eastern",
    "Ahafo", "Northern", "Oti", "Savannah", "North East",
    "Upper East", "Upper West", "Volta", "Western", "Western North"
] as const;

export const GHANA_DISTRICTS_BY_REGION: Record<string, string[]> = {
    "Greater Accra": [
        "Accra Metropolitan (AMA)", "Tema Metropolitan (TMA)", "Kpone Katamanso Metropolitan", 
        "Ablekuma Central Municipal", "Ablekuma North Municipal", "Ablekuma West Municipal",
        "Adentan Municipal", "Ashaiman Municipal", "Ayawaso Central Municipal", "Ayawaso East Municipal",
        "Ayawaso West Municipal", "Ayawaso North Municipal", "Ga Central Municipal", "Ga East Municipal",
        "Ga North Municipal", "Ga South Municipal", "Ga West Municipal", "Krowor Municipal",
        "La Dade Kotopon Municipal", "Ledzokuku Municipal", "La Nkwantanang Madina Municipal",
        "Okaikwei North Municipal", "Tema West Municipal", "Weija Gbawe Municipal", "Shai-Osudoku Municipal",
        "Ada East District", "Ada West District", "Ningo-Prampram District"
    ],
    "Ashanti": [
        "Kumasi Metropolitan", "Ahafo Ano North Municipal", "Asante Akim Central Municipal", 
        "Asante Akim South Municipal", "Asokore Mampong Municipal", "Asokwa Municipal", 
        "Atwima Nwabiagya Municipal", "Bekwai Municipal", "Ejisu Municipal", "Ejura/Sekyedumase Municipal", 
        "Juaben Municipal", "Kwabre East Municipal", "Kwadaso Municipal", "Mampong Municipal", 
        "Obuasi Municipal", "Offinso Municipal", "Oforikrom Municipal", "Old Tafo Municipal", 
        "Suame Municipal", "Adansi Asokwa District", "Adansi North District", "Adansi South District", 
        "Afigya-Kwabre North District", "Afigya-Kwabre South District", "Ahafo Ano South East District", 
        "Ahafo Ano South West District", "Akrofuom District", "Amansie Central District", 
        "Amansie South District", "Amansie West District", "Asante Akim North District", 
        "Atwima Kwanwoma District", "Atwima Mponua District", "Atwima Nwabiagya North District", 
        "Bosome Freho District", "Bosomtwe District", "Obuasi East District", "Offinso North District", 
        "Sekyere Afram Plains District", "Sekyere Central District", "Sekyere East District", 
        "Sekyere Kumawu District", "Sekyere South District"
    ],
    "Bono": [
        "Sunyani Municipal", "Berekum East Municipal", "Dormaa Central Municipal", "Wenchi Municipal",
        "Sunyani West Municipal", "Jaman South Municipal", "Berekum West District",
        "Banda District", "Dormaa West District", "Dormaa East District",
        "Jaman North District", "Tain District"
    ],
    "Bono East": [
        "Techiman Municipal", "Kintampo North Municipal", "Nkoranza South Municipal",
        "Atebubu-Amantin Municipal", "Techiman North District", "Pru East District", "Kintampo South District",
        "Nkoranza North District", "Sene East District", "Sene West District", "Pru West District"
    ],
    "Central": [
        "Cape Coast Metropolitan", "Effutu Municipal", "Agona West Municipal",
        "Assin Fosu Municipal", "Awutu Senya East Municipal", "Komenda-Edina-Eguafo-Abirem Municipal", 
        "Mfantseman Municipal", "Upper Denkyira East Municipal", "Abura-Asebu-Kwamankese District", 
        "Agona East District", "Ajumako-Enyan-Essiam District", "Asikuma-Odoben-Brakwa District", 
        "Assin North District", "Assin South District", "Awutu Senya West District", "Ekumfi District", 
        "Gomoa Central District", "Gomoa East District", "Gomoa West District", "Twifo-Ati Morkwa District",
        "Twifo Heman Lower Denkyira District", "Upper Denkyira West District"
    ],
    "Eastern": [
        "Abuakwa North Municipal", "Abuakwa South Municipal", "Akwapim North Municipal",
        "Birim Central Municipal", "Kwaebibirem Municipal", "Kwahu West Municipal",
        "Lower Manya Krobo Municipal", "New Juaben North Municipal", "New Juaben South Municipal",
        "Nsawam Adoagyiri Municipal", "Suhum Municipal", "West Akim Municipal", "Yilo Krobo Municipal",
        "Achiase District", "Akuapem South District", "Akyemansa District", "Asene-Manso-Akroso District",
        "Asuogyaman District", "Atiwa East District", "Atiwa West District", "Ayensuano District",
        "Birim North District", "Birim South District", "Denkyembuor District", "Fanteakwa North District",
        "Fanteakwa South District", "Kwahu Afram Plains North District", "Kwahu Afram Plains South District",
        "Kwahu East District", "Kwahu South District", "Okere District", "Upper Manya Krobo District",
        "Upper West Akim District"
    ],
    "Ahafo": [
        "Asunafo North Municipal", "Tano North Municipal", "Tano South Municipal",
        "Asunafo South District", "Asutifi North District", "Asutifi South District"
    ],
    "Northern": [
        "Tamale Metropolitan", "Gushegu Municipal", "Nanumba North Municipal", "Sagnarigu Municipal", 
        "Savelugu Municipal", "Yendi Municipal", "Karaga District", "Kpandai District", 
        "Kumbungu District", "Mion District", "Nanton District", "Nanumba South District", 
        "Saboba District", "Tatale Sanguli District", "Tolon District", "Zabzugu District"
    ],
    "Oti": [
        "Jasikan Municipal", "Krachi East Municipal", "Krachi West Municipal",
        "Nkwanta South Municipal", "Biakoye District", "Guan District", "Kadjebi District",
        "Krachi Nchumuru District", "Nkwanta North District"
    ],
    "Savannah": [
        "East Gonja Municipal", "West Gonja Municipal", "Bole District",
        "Central Gonja District", "North Gonja District", "North East Gonja District",
        "Sawla-Tuna-Kalba District"
    ],
    "North East": [
        "East Mamprusi Municipal", "West Mamprusi Municipal", "Bunkpurugu Nakpanduri District",
        "Chereponi District", "Mamprugu Moagduri District", "Yunyoo Nasuan District"
    ],
    "Upper East": [
        "Bawku Municipal", "Bolgatanga Municipal", "Kassena Nankana East Municipal", "Builsa North Municipal",
        "Bawku West District", "Binduri District", "Bolgatanga East District", "Bongo District",
        "Builsa South District", "Garu District", "Kassena Nankana West District", "Nabdam District",
        "Pusiga District", "Talensi District", "Tempane District"
    ],
    "Upper West": [
        "Jirapa Municipal", "Lawra Municipal", "Nandom Municipal", "Sissala East Municipal",
        "Wa Municipal", "Daffiama-Bussie-Issa District", "Lambussie District",
        "Nadowli-Kaleo District", "Sissala West District", "Wa East District", "Wa West District"
    ],
    "Volta": [
        "Ho Municipal", "Hohoe Municipal", "Keta Municipal", "Ketu North Municipal",
        "Ketu South Municipal", "Kpando Municipal", "Adaklu District", "Afadzato South District",
        "Agotime-Ziope District", "Akatsi North District", "Akatsi South District", "Anloga District",
        "Central Tongu District", "Ho West District", "North Dayi District", "North Tongu District",
        "South Dayi District", "South Tongu District"
    ],
    "Western": [
        "Sekondi-Takoradi Metropolitan", "Ahanta West Municipal", "Effia-Kwesimintsim Municipal",
        "Jomoro Municipal", "Nzema East Municipal", "Prestea-Huni Valley Municipal",
        "Tarkwa-Nsuaem Municipal", "Wassa Amenfi East Municipal", "Wassa Amenfi West Municipal",
        "Ellembelle District", "Mpohor District", "Shama District", "Wassa Amenfi Central District",
        "Wassa East District"
    ],
    "Western North": [
        "Aowin Municipal", "Bibiani Anhwiaso Bekwai Municipal", "Sefwi Wiawso Municipal",
        "Bia East District", "Bia West District", "Bodi District", "Juaboso District",
        "Sefwi Akontombra District", "Suaman District"
    ]
};

export const PRODUCT_CONDITIONS = ['New', 'Refurbished', 'Home-used', 'Used - Like New', 'Used - Good', 'Used - Fair'] as const;

export const PRODUCT_CATEGORIES = [
    "Electronics",
    "Phones & Tablets",
    "Vehicles",
    "Heavy Equipment & Commercial Tools", 
    "Property & Real Estate",
    "Home, Furniture & Appliances",
    "Fashion & Beauty",
    "Health & Wellness",
    "Pets & Animals",                      
    "Agriculture & Food",
    "Babies & Kids Items",
    "Sports, Arts & Outdoors",
    "Jobs & Services",
    "Other",
] as const;

export type Category = typeof PRODUCT_CATEGORIES[number];

export const SUB_CATEGORIES_BY_CATEGORY: Record<Category, string[]> = {
    "Electronics": [
        "Laptops & Computers", "TVs & Smart Displays", "Audio & Sound Systems", 
        "Cameras & Camcorders", "Video Game Consoles", "Computer Accessories"
    ],
    "Phones & Tablets": [
        "Mobile Phones", "Tablets", "Smartwatches & Trackers", 
        "Mobile Accessories", "Cases & Screen Protectors"
    ],
    "Vehicles": [
        "Cars & SUVs", "Motorcycles & Scooters", "Buses & Microbuses", 
        "Trucks & Trailers", "Vehicle Parts & Accessories"
    ],
    "Heavy Equipment & Commercial Tools": [
        "Construction Machinery", 
        "Industrial Generators & Power", 
        "Manufacturing & Factory Plants", 
        "Forklifts & Material Handling",
        "Medical & Laboratory Equipment",
        "Professional Hand & Power Tools"
    ],
    "Property & Real Estate": [
        "Houses for Rent", "Houses for Sale", "Apartments & Flats for Rent", 
        "Apartments & Flats for Sale", "Commercial Property", "Land & Plots"
    ],
    "Home, Furniture & Appliances": [
        "Furniture", "Kitchen Appliances", "Laundry & Cleaning Appliances", 
        "Kitchenware & Cookware", "Home Decor & Lighting", "Bedding & Textiles"
    ],
    "Fashion & Beauty": [ 
        "Men's Clothing", "Men's Shoes", "Women's Clothing", 
        "Women's Shoes", "Bags & Purses", "Jewelry & Watches",
        "Skincare & Body Products", "Makeup & Cosmetics", "Hair Care & Wigs", 
        "Fragrances & Perfumes"
    ],
    "Health & Wellness": [ 
        "Vitamins & Supplements", "Medical Equipment & Braces", "Fitness Accessories"
    ],
    "Pets & Animals": [
        "Dogs & Puppies", "Cats & Kittens", "Birds & Poultry", 
        "Pet Food & Nutrition", "Pet Accessories & Cages", "Veterinary Supplies"
    ],
    "Agriculture & Food": [
        "Farm Machinery & Tractors", "Livestock & Poultry", "Seeds & Fertilizers", 
        "Fresh Food & Groceries", "Wholesale Agro Commodities"
    ],
    "Babies & Kids Items": [
        "Children's Clothing", "Children's Shoes", "Toys & Games", 
        "Baby Strollers & Car Seats", "Baby Feeding & Care"
    ],
    "Sports, Arts & Outdoors": [ 
        "Gym & Fitness Gear", "Camping & Outdoor Equipment", "Musical Instruments", 
        "Bicycles & Cycling Accessories", "Books & Stationery", "Art & Collectibles"
    ],
    "Jobs & Services": [
        "Job Vacancies", "Freelance & Professional Services", "Car Rentals & Transport", 
        "Event Planning & Catering", "Repair & Installation Services"
    ],
    "Other": [ 
        "General Items", "Miscellaneous"
    ]
};
