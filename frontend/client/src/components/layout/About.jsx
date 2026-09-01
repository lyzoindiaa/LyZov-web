const categories = [
    {
        title: "Women's Fashion",
        tag: "Style & Essentials",
        accent: "amber",
        description: [
            "Explore a variety of women's clothing and fashion essentials, including kurtis, sarees, dresses, tops, jeans, leggings, nightwear, ethnic outfits, footwear, and seasonal fashion.",
            "Our collection includes everyday styles as well as products suitable for festive occasions and special events.",
        ],
    },
    {
        title: "Men's Fashion",
        tag: "Everyday Essentials",
        accent: "blue",
        description: [
            "Discover clothing and accessories for men, including T-shirts, shirts, jeans, trousers, jackets, sweaters, activewear, ethnic wear, kurtas, sherwanis, footwear, wallets, belts, bags, watches, and other accessories.",
        ],
    },
    {
        title: "Kids & Baby Products",
        tag: "Family First",
        accent: "green",
        description: [
            "Shop for children of different age groups with products ranging from everyday clothing to festive outfits and useful baby-care essentials.",
            "Our selection includes rompers, kids' dresses, T-shirts, ethnic wear, jackets, school essentials, baby blankets, towels, pillows, and other everyday products.",
        ],
    },
    {
        title: "Home, Kitchen & Lifestyle",
        tag: "Home Upgrade",
        accent: "rose",
        description: [
            "Make everyday living easier with useful products for your home and kitchen. Explore cookware, kitchen tools, storage products, bottles, lunch boxes, home furnishings, cushions, curtains, bedsheets, decorative products, organisers, and more.",
            "Whether you're setting up a new home or looking for products for your retail store, LyZov offers a broad selection to explore.",
        ],
    },
    {
        title: "Electronics & Everyday Gadgets",
        tag: "Smart Living",
        accent: "violet",
        description: [
            "Find practical electronic accessories and gadgets for home, office, travel, and personal use.",
            "Our selection may include mobile accessories, chargers, data cables, earphones, headphones, speakers, power banks, smart accessories, computer peripherals, storage devices, and other electronic essentials.",
        ],
    },
    {
        title: "Beauty, Personal Care & Grooming",
        tag: "Wellness & Care",
        accent: "cyan",
        description: [
            "Discover everyday beauty and personal-care products across skincare, haircare, makeup, grooming, and hygiene categories.",
            "From cosmetics and makeup accessories to hair-care and grooming essentials, LyZov provides multiple options for everyday requirements and retail businesses.",
        ],
    },
];

const godIdols = [
    "Lord Ganesha Idols",
    "Lord Krishna Idols",
    "Radha Krishna Idols",
    "Lord Shiva Idols",
    "Shivling",
    "Maa Durga Idols",
];

const bulletStyles = [
    "bullet-amber",
    "bullet-blue",
    "bullet-green",
    "bullet-rose",
    "bullet-violet",
    "bullet-cyan",
];

function AboutLyZov() {
    return (
        <main className="about-lyzov">
            <div className="about-container">

                {/* Hero / Introduction */}
                <header className="about-header-shell">
                    <h1>About LyZov</h1>
                </header>

                <section className="about-card about-header">
                    <h2>A Smarter Place to Buy, Sell &amp; Grow</h2>

                    <p>
                        <strong>LyZov</strong> is an online marketplace built for everyday
                        shoppers, retailers, resellers, and suppliers. Our goal is simple
                        — bring a wide variety of products together while creating better
                        opportunities for both buyers and sellers.
                    </p>

                    <p>
                        Whether you need a single product for personal use, want to
                        purchase products for your shop, or are a supplier looking to
                        reach new retailers, LyZov gives you a convenient platform to
                        explore business opportunities.
                    </p>
                </section>

                {/* Marketplace */}
                <section className="about-card about-section">
                    <h2>Everything You Need, All in One Place</h2>

                    <p>
                        LyZov brings products from multiple categories under one platform.
                        From fashion and home essentials to electronics, beauty, kids'
                        products, pooja items, and everyday utility products, our
                        marketplace is designed to serve different types of customers.
                    </p>

                    <p>
                        You can discover products for personal shopping as well as
                        products suitable for retail and resale businesses.
                    </p>
                </section>

                {/* Product Categories */}
                <div className="about-category-grid">
                    {categories.map((category) => (
                        <article
                            className={`about-card about-category-card category-tone-${category.accent}`}
                            key={category.title}
                        >
                            <span className="category-pill">{category.tag}</span>
                            <h2>{category.title}</h2>

                            {category.description.map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </article>
                    ))}
                </div>

                {/* Spiritual Products */}
                <section className="about-card about-section spiritual-section">
                    <div className="spiritual-header">
                        <span className="category-pill spiritual-pill">Sacred Essentials</span>
                        <h2>God Idols, Pooja &amp; Spiritual Products</h2>
                    </div>

                    <p>
                        Create a peaceful and devotional space with our collection of{" "}
                        <strong>God Idols and Pooja essentials</strong>.
                    </p>

                    <p>
                        Explore idols and devotional products suitable for homes, offices,
                        shops, temples, gifting, festivals, and religious occasions.
                    </p>

                    <div className="subcategory">
                        <h3>God Idols</h3>

                        <ul className="about-list">
                            {godIdols.map((item, index) => (
                                <li key={item} className={bulletStyles[index % bulletStyles.length]}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </section>

            </div>
        </main>
    );
}

export default AboutLyZov;