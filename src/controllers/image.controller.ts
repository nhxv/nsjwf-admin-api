import { Request, Response, NextFunction, Router } from "express";
import { verifyAccessToken } from "../services/auth/token.service";
import { hasAnyRole } from "../services/auth/authorization.service";
import { Role } from "../commons/enums/role.enum";
import { fetchImageFromVendorOrder } from "../services/image.service";

const router = Router();

router.get(
  `/images/vendor-orders/:code`,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attachmentPath = await fetchImageFromVendorOrder(req.params.code);
      if (attachmentPath) {
        res.sendFile(attachmentPath);
      } else {
        res.status(404).send();
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;
