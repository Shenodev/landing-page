import { Request, Response, NextFunction } from "express";
import { unsubscribeEmail, requestDeletion } from "../services/privacy.service";

export const postUnsubscribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await unsubscribeEmail(req.body);
    res.status(200).json({
      message: "You have been unsubscribed. You will no longer receive non-essential emails from ShenoDev.",
      data: result,
    });
  } catch (err: unknown) {
    next(err);
  }
};

export const postDeletionRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await requestDeletion(req.body);
    res.status(201).json({
      message: "Deletion request received. We will erase your personal data within 30 days and confirm by email.",
      data: result,
    });
  } catch (err: unknown) {
    next(err);
  }
};
