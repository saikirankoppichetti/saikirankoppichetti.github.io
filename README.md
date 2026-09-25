# Sai Kiran Koppichetti - Portfolio

Personal portfolio of Sai Kiran Koppichetti, an AI/ML Engineer working on retrieval-augmented generation (RAG), agentic LLM pipelines and risk models for regulated domains.

**Live site:** [saikirankoppichetti.com](https://saikirankoppichetti.com)

## Links

- Portfolio: [saikirankoppichetti.com](https://saikirankoppichetti.com)
- GitHub: [github.com/saikirankoppichetti](https://github.com/saikirankoppichetti)
- LinkedIn: [linkedin.com/in/saikirankoppichetti97](https://www.linkedin.com/in/saikirankoppichetti97/)
- Email: [koppichettisaikiran97@gmail.com](mailto:koppichettisaikiran97@gmail.com)

## What's on the site

- **About** and hero summary
- **Experience:** Capital One, Nitara, GRROOM and Market Data Forecast
- **Selected Work:** projects from GitHub, such as [surecast](https://github.com/saikirankoppichetti/surecast), [ai_soc](https://github.com/saikirankoppichetti/ai_soc) and [medical-chatbot](https://github.com/saikirankoppichetti/medical-chatbot)
- **Skills** and **Education**
- **Contact**

## How it works

A static site built with vanilla HTML, CSS and JavaScript and hosted on GitHub Pages. All content is loaded from JSON files, so updating the site means editing data rather than markup.

```
index.html          page structure
assets/css/         styles
assets/js/main.js   renders each section from data/*.json
assets/img/         portrait, company logos and project card images
data/               hero, about, experience, projects, skills, education, contact
CNAME               custom domain (saikirankoppichetti.com)
```

### Updating content

- Projects: edit `data/projects.json`. A card uses `assets/img/projects/<repo-name>.png` if it exists, otherwise the image for its category.
- Company logos: add the file to `assets/img/logos/` and register it in `COMPANY_LOGOS` in `assets/js/main.js`.
- Portrait: replace `assets/img/portrait.png`.

### Run locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000. The data files are fetched by the browser, so opening `index.html` directly from disk will not work.

## Credits

Built from the Amber Terminal portfolio template and customized for this site.
