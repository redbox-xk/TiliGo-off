import { Router, type IRouter } from "express";
import healthRouter from "./health";
import shopsRouter from "./shops";
import ordersRouter from "./orders";
import deliveryRouter from "./delivery";

const router: IRouter = Router();

router.use(healthRouter);
router.use(shopsRouter);
router.use(ordersRouter);
router.use(deliveryRouter);

export default router;
