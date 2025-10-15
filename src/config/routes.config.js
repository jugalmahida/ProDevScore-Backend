import reviewRoute from "../routes/analysisreport.route.js";
import userRoute from "../routes/user.route.js";
import pricingPlanRoute from "../routes/pricingplan.route.js";

export const setupRoutes = (app) => {
  const routes = {
    review: reviewRoute,
    user: userRoute,
    pricingPlan: pricingPlanRoute,
  };
  Object.entries(routes).forEach(([path, router]) => {
    app.use(`/api/${process.env.VERSION}/${path}`, router);
  });
};
