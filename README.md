# Colare screening cost calculator

Compare one technical screening step, for the same role and candidates, over one month.

## Use the calculator

Enter five inputs: candidates per month, total engineering minutes per candidate today, total engineering minutes with Colare, loaded engineering hourly cost and the Colare quote for the month.

The page shows today's estimated cost, the estimated cost with Colare and the difference. Recruiter time, setup/calibration and other expenses can be included in the optional breakdown. Excluded items are stated beside the result. Included costs left blank remain unknown; enter zero only when there is no cost. No Colare price is assumed.

The example inputs are illustrative, not a customer result or a promise of reduced workload. Staff costs value time; a lower estimate does not necessarily mean lower payroll or cash spending. Unchanged interviews are outside the comparison. The detailed model remains available at `detailed/` for multiple stages, participation rates and different hiring volumes.

Inputs stay in browser memory and reset on refresh. No analytics or backend is connected, and input data is not uploaded.

## Edit and run

Edit `index.html`, `styles.css`, `app.js` and `model.js` directly. GitHub Pages serves the `main` branch root. There is no build step.

Run the main calculation checks with `node test-model.cjs`. Run the preserved detailed model checks with `node detailed/test-model.cjs`.

Fustat and Inter redistribution licenses are included in `assets/`. Colare’s logo and brand assets remain the property of their respective owner. This repository grants no trademark license.
