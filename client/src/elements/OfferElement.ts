import { IOffer } from "shared";

export default class OfferElement extends HTMLElement {

    public update(offer: Partial<IOffer>): void {
        const lookupButton = this.querySelector('.offer-lookup-button') as HTMLAnchorElement;
        const titleElement = this.querySelector('.offer-title') as HTMLElement;
        const typeElement = this.querySelector('.offer-type') as HTMLElement;
        const descriptionElement = this.querySelector('.offer-description') as HTMLElement;
        const categoryElement = this.querySelector('.offer-category') as HTMLElement;
        const locationElement = this.querySelector('.offer-location') as HTMLElement;
        const exchangeElement = this.querySelector('.offer-exchange') as HTMLElement;
        const pictureElement = this.querySelector('.offer-picture') as HTMLImageElement;
        const picturesElement = this.querySelector('.offer-pictures') as HTMLElement;
        const indicatorsElement = this.querySelector('.carousel-indicators') as HTMLElement;

        if (lookupButton) lookupButton.href = `/offer?id=${offer._id}`;
        if (titleElement) titleElement.textContent = offer.title || "Sans titre";
        if (typeElement) typeElement.textContent = offer.type || "";
        if (descriptionElement) descriptionElement.textContent = offer.description || "";
        if (categoryElement) categoryElement.textContent = offer.category || "";
        if (locationElement) locationElement.textContent = offer.location || "Non spécifiée";
        if (exchangeElement) exchangeElement.textContent = offer.exchange || "Non spécifiée";
        
        if (pictureElement) {
            pictureElement.src = offer.pictures?.[0] ?? "https://placehold.co/600x400";
            pictureElement.style.height = "200px"
            pictureElement.classList.add("d-block", "w-100", "object-fit-cover");
        }

        if (picturesElement) {
            picturesElement.innerHTML = "";
            if (indicatorsElement) indicatorsElement.innerHTML = "";

            const pictures = offer.pictures?.length
                ? offer.pictures
                : ["https://placehold.co/800x450/33A366/ffffff?text=Aucune+image"];

            pictures.forEach((picture: string, index: number) => {
                const carouselItem = document.createElement("div");
                carouselItem.classList.add("carousel-item");
                if (index === 0) carouselItem.classList.add("active");

                const imageElement = document.createElement("img");
                imageElement.src = picture;
                imageElement.alt = `Image ${index + 1} de l'annonce`;
                imageElement.classList.add("d-block", "w-100", "object-fit-cover");
                imageElement.style.height = "450px"; 

                carouselItem.appendChild(imageElement);
                picturesElement.appendChild(carouselItem);

                if (indicatorsElement) {
                    const indicator = document.createElement("button");
                    indicator.type = "button";
                    indicator.dataset.bsTarget = "#offer-carousel";
                    indicator.dataset.bsSlideTo = index.toString();
                    indicator.ariaLabel = `Slide ${index + 1}`;
                    if (index === 0) {
                        indicator.classList.add("active");
                        indicator.ariaCurrent = "true";
                    }
                    indicatorsElement.appendChild(indicator);
                }
            });
        }
    }
}