"use client";
import { Download } from "lucide-react";
import type { LunaController } from "../lib/use-luna";
import { Modal } from "./modal";
export function ResetDialog({
  setModal,
  t,
  exportData,
  resetData,
}: Pick<LunaController, "setModal" | "t" | "exportData" | "resetData">) {
  return (
    <Modal title={t.resetTitle} close={() => setModal(null)} closeLabel={t.close}>
      <p className="modal-intro">{t.resetText}</p>
      <button className="secondary full" onClick={exportData}>
        <Download size={16} />
        {t.export}
      </button>
      <div className="confirm-actions">
        <button className="secondary" onClick={() => setModal("settings")}>
          {t.keepData}
        </button>
        <button className="primary danger" onClick={resetData}>
          {t.deleteEverything}
        </button>
      </div>
    </Modal>
  );
}
