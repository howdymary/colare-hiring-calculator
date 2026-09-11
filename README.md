# Colare hiring workload calculator

An interactive browser-based model for comparing a current hiring process with a proposed assessment change.

## Use the calculator

1. Define a cohort and measurement period.
2. Enter the current stages, participation, minutes and interviewers.
3. Choose replacement or an additive evaluation.
4. Include remaining review, exceptions, setup and calibration effort.
5. Add rates and commercial costs for the economic comparison.

Results update as inputs change. The built-in example is illustrative and is not a customer result, a capacity promise or a quote. Blank values remain unknown. The model distinguishes labor capacity from cash savings and withholds ROI until the required cost inputs are present.

Inputs stay in memory. Export inputs and calculations to JSON before refreshing or closing. No input data is uploaded, and no analytics or backend is connected.

## Edit and run

Edit `index.html`, `styles.css`, `app.js` and `model.js` directly. GitHub Pages serves the `main` branch root. There is no build step.

Run the calculation checks with `node test-model.cjs`.

Fustat and Inter redistribution licenses are included in `assets/`. Colare’s logo and brand assets remain the property of their respective owner. This repository grants no trademark license.
