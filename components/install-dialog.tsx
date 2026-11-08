"use client";
import { InstallPanel } from "./luna-install";
import type { LunaController } from "../lib/use-luna";
import { Modal } from "./modal";
export function InstallDialog({
  setModal,
  pwa,
  locale,
  t,
}: Pick<LunaController, "setModal" | "pwa" | "locale" | "t">) {
  return (
    <Modal title={t.install} close={() => setModal(null)} closeLabel={t.close}>
      <InstallPanel locale={locale} pwa={pwa} />
    </Modal>
  );
}
