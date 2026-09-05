import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroImg from "../../assets/Hero.png";
import { markCollectionHeroSeen } from "../../utils/collectionHero";

const carouselSlides = [
    {
        // title: "Everything You Love",
        // subtitle: "Now on LyZov",
        button: "Browse Collection",
        image: HeroImg,
        to: "/shop",
    },
    {
        // title: "Shop Smarter",
        // subtitle: "Live better.",
        button: "View Bestsellers",
        image:
            HeroImg,
        to: "/shop",
    },
];

function CollectionHero() {
    const navigate = useNavigate();
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        if (carouselSlides.length <= 1) return undefined;

        const interval = setInterval(() => {
            setActiveSlide((current) => (current + 1) % carouselSlides.length);
        }, 4200);

        return () => clearInterval(interval);
    }, []);

    const slide = carouselSlides[activeSlide];

    const handleBrowse = () => {
        navigate(slide.to || "/shop");
    };

    return (
        <section className="about-hero-carousel" aria-label="LyZov collection banner">
            <div className="about-hero-image-wrap">
                <img src={slide.image} alt={slide.title} className="about-hero-image" />
                <div className="about-hero-overlay" />
                <div className="about-hero-content">
                    {/* <p className="about-hero-kicker">Curated for every lifestyle</p> */}
                    {/* <h2>{slide.title}</h2>
                    <p>{slide.subtitle}</p> */}
                    <button type="button" className="about-hero-button" onClick={handleBrowse}>
                        {slide.button}
                    </button>
                </div>
            </div>
        </section>
    );
}

export default CollectionHero;
