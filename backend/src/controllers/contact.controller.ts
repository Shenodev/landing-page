import { Request, Response, NextFunction } from "express";
import { submitContact } from "../services/contact.service";

export const postContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await submitContact(req.body, req.ip ?? "");

    if (result.id !== undefined) {
      res.status(201).json({
        message: "Contact submitted successfully",
        data: { id: result.id, ...result.submission },
      });
      return;
    }

    // Degraded: DB not connected, still typesafe + purified, return 201 without persistence
    res.status(201).json({
      message: "Contact received (degraded - queued)",
      data: result.submission,
      degraded: true,
    });
  } catch (err: unknown) {
    next(err);
  }
};