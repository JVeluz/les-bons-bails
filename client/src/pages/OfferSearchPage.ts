import HTML from "../html/offer-search-page.html";
import OfferCardHTML from "../html/offer-card.html";
import OfferElement from "../elements/OfferElement";
import { IOffer } from "shared";
import Application from "../models/Application";
import OfferService from "../services/OfferService";
import { WithLoading } from "../controllers/decorators";

export default class OfferSearchPage extends HTMLElement {
    private offerService = new OfferService();

    private offerContainer!: HTMLElement;
    private searchForm!: HTMLFormElement;
    private filterForm!: HTMLFormElement;

    public async connectedCallback() {
        this.innerHTML = HTML;

        this.offerContainer = this.querySelector(".offer-container")!;
        this.searchForm = this.querySelector("#search-form") as HTMLFormElement;
        this.filterForm = this.querySelector("#filter-form") as HTMLFormElement;

        if (this.searchForm) {
            this.searchForm.onsubmit = (event) => this.onSearchSubmit(event);
        }
        if (this.filterForm) {
            this.filterForm.onsubmit = (event) => this.onSearchSubmit(event);
        }

        this.update(await this.offerService.getAll());
    }

    @WithLoading()
    public async onSearchSubmit(event: Event): Promise<void> {
        event.preventDefault();
        const formData = new FormData(this.searchForm);
        const terms = formData.get("input") as string;

        let result: IOffer[];
        try {
            if (terms) {
                result = await this.offerService.getByTerms(terms);
            } else {
                result = await this.offerService.getAll();
            }
        } catch (error) {
            return;
        }
        this.update(result);
    }

    public update(offers: IOffer[]): void {
        this.offerContainer.innerHTML = "";
        for (const offer of offers) {
            const offerElement = document.createElement("offer-element") as OfferElement;
            offerElement.innerHTML = OfferCardHTML;
            offerElement.update(offer);
            this.offerContainer.appendChild(offerElement);
        }
    }
}