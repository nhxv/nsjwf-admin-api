import { Request, Response, NextFunction, Router } from "express";
import { verifyAccessToken } from "../services/auth/token.service";
import { hasAnyRole } from "../services/auth/authorization.service";
import { Role } from "../commons/enums/role.enum";
import { fetchImageFromVendorOrder } from "../services/image.service";

const router = Router();

router.get(
  `/images/vendor-orders/:code`,
  [verifyAccessToken, hasAnyRole([Role.ADMIN, Role.MASTER])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attachmentPath = await fetchImageFromVendorOrder(req.params.code);
      if (attachmentPath) {
        interface SysError extends Error {
          errno: number;
          code: string;
          syscall: string;
          path?: string;
          status: number;
        }
        res.sendFile(attachmentPath, (error: SysError) => {
          if (error) {
            if (error?.code === "ENOENT") {
              console.log(`Attachment ${error?.path} doesn't exist.`);
            } else {
              console.log(error);
            }
          }
        });
      } else {
        res.status(404).send();
      }
    } catch (error) {
      next(error);
    }
  },
);

export default router;
