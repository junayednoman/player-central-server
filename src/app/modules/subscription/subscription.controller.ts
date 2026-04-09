import { Request, Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import { subscriptionServices } from "./subscription.service";

const getPlans = handleAsyncRequest(async (req: Request, res: Response) => {
  const result = await subscriptionServices.getPlans(req.query.role as string);
  sendResponse(res, {
    message: "Subscription plans retrieved successfully!",
    data: result,
  });
});

const createPlan = handleAsyncRequest(async (req: Request, res: Response) => {
  const result = await subscriptionServices.createPlan(req.body);
  sendResponse(res, {
    message: "Subscription plan created successfully!",
    data: result,
  });
});

const updatePlan = handleAsyncRequest(async (req: Request, res: Response) => {
  const result = await subscriptionServices.updatePlan(
    req.params.planId as string,
    req.body
  );
  sendResponse(res, {
    message: "Subscription plan updated successfully!",
    data: result,
  });
});

const checkout = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await subscriptionServices.checkout(
    req.user?.id as string,
    req.body
  );
  sendResponse(res, {
    message: "Subscription checkout created successfully!",
    data: result,
  });
});

const getMySubscription = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await subscriptionServices.getMySubscription(
      req.user?.id as string
    );
    sendResponse(res, {
      message: "Subscription retrieved successfully!",
      data: result,
    });
  }
);

const confirmPayment = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await subscriptionServices.confirmPayment(
      req.user?.id as string,
      req.params.subscriptionId as string
    );
    sendResponse(res, {
      message: "Subscription payment confirmed successfully!",
      data: result,
    });
  }
);

const setAutoRenewal = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await subscriptionServices.setAutoRenewal(
      req.user?.id as string,
      req.params.subscriptionId as string,
      req.body
    );
    sendResponse(res, {
      message: "Subscription auto renewal updated successfully!",
      data: result,
    });
  }
);

const handleStripeWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"];

    if (!signature || Array.isArray(signature)) {
      res.status(400).json({
        success: false,
        message: "Stripe signature is missing",
      });
      return;
    }

    const result = await subscriptionServices.handleWebhook(
      req.body as Buffer,
      signature
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Webhook handling failed",
    });
  }
};

export const subscriptionController = {
  getPlans,
  createPlan,
  updatePlan,
  checkout,
  getMySubscription,
  confirmPayment,
  setAutoRenewal,
  handleStripeWebhook,
};
