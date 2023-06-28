# TRxiv2 - Track Popular bioRxiv Papers Every Week

TRxiv2 is a website that tracks popular preprints on bioRxiv. It utilizes the Altmetric API to fetch the highest-scoring preprints published in the past month and integrates them with the category and detailed information obtained from the bioRxiv API. It showcases up to ten top-scoring articles per category. It is updated every Wednesday and Sunday.

**To use it, visit the [TRxiv2 website](https://blog.yorks0n.com/TRxiv2/).**

## Features

- Gets preprints popularity according to [Altmetric score](https://help.altmetric.com/support/solutions/articles/6000233311-how-is-the-altmetric-attention-score-calculated-).
- Use bioRxiv categories  to classify and display articles.
- Show up to ten highest-scoring preprints published in the past month.

## Workflow

This repo uses GitHub Action to process and publish TRvix2 website. Basically, it works as following: 

1. Run `dist/index.js` to get `data.json`, which containing the processed articles info.
2. Run `dist/json2md.js` to generate hugo pages and save them into `hugo_site/content/posts/`
3. Change to the `hugo_site` directory and run `hugo` to generate website.
4. Publish the website to another repository `Yorks0n/TRxiv2`.

## Acknowledgements

TRxiv2 utilizes the following APIs:

- [Altmetric API](https://api.altmetric.com/) - Fetches article metrics.
- [bioRxiv API](https://api.biorxiv.org/) - Retrieves preprint information.

## Disclaimer

TRxiv2 is an independent tool and is not affiliated with or endorsed by bioRxiv or Altmetric.