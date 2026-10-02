import type { Accessory, ShopService, User } from "@/services/contracts";
import type { HttpClient } from "./http";

export function createApiShopService(http: HttpClient): ShopService {
  return {
    listAccessories: () => http.request<Accessory[]>("GET", "/shop/accessories"),
    purchase: (accessoryId) => http.request<User>("POST", "/shop/purchase", { body: { accessoryId } }),
  };
}
