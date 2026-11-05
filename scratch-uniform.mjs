// Vaqtinchalik skript: jadvaldagi qatorlar bir xil, taklif va huquq tahrirlash oynasida (keyin o'chiriladi)
import fs from "fs";

const read = (file) => fs.readFileSync(file, "utf8").split("\r\n").join("\n");

const edit = (file, pairs) => {
  let s = read(file);
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(`${file}: ${a.slice(0, 70)}`);
    s = s.replace(a, b);
  }
  fs.writeFileSync(file, s);
};

// Bo'lakni boshidan oxirigacha olib tashlash
const cut = (file, from, to) => {
  let s = read(file);
  const a = s.indexOf(from);
  const b = s.indexOf(to, a);
  if (a === -1 || b === -1) throw new Error(`${file}: cut ${from.slice(0, 40)}`);
  s = s.slice(0, a) + s.slice(b);
  fs.writeFileSync(file, s);
};

const parts = "src/pages/ControlUsers/UserParts.jsx";

// Belgilar: ega, boshqaruvchi, qolgan hamma - "A'zo"
edit(parts, [
  [
    `// account - "owner" (uy egasi), "member" (o'z hisobi bilan kiradi) yoki yo'q.`,
    `// account - "owner" (uy egasi), "admin" (boshqaruvchi), qolganlar bir xil "A'zo".`,
  ],
  [
    `      {account === "member" && (
        <span className="control__account-badge control__account-badge--member badge">
          <AppIcon name="check" />
          {t("control.roles.member")}
        </span>
      )}

      {!account && (
        <span className="control__account-badge control__account-badge--none badge">
          {t("control.roles.noAccount")}
        </span>
      )}`,
    `      {account !== "owner" && account !== "admin" && (
        <span className="control__account-badge control__account-badge--none badge">
          {t("control.roles.member")}
        </span>
      )}`,
  ],
  [
    `// compact - jadval uchun faqat ikonkalar, nomi esa tooltip'da
// onInvite - hisobi yo'q xonadoshga taklif havolasi (bo'lmasa tugma chiqmaydi)
// adminState - "admin" yoki "member" (hisobi bor, ega emas); onToggleAdmin - faqat egaga beriladi
export const UserActions = ({
  user,
  compact = false,
  onInvite,
  adminState,
  onToggleAdmin,`,
    `// compact - jadval uchun faqat ikonkalar, nomi esa tooltip'da
export const UserActions = ({
  user,
  compact = false,`,
  ],
]);

cut(parts, "        {onInvite && (\n          <button\n            className=\"control__icon-btn control__icon-btn--invite\"", "        <button\n          className={`control__icon-btn control__icon-btn--swap");
cut(parts, "      {onInvite && (\n        <button\n          className=\"btn btn-sm btn-outline-success me-2\"", "      <button\n        className={`btn btn-sm ${swapButton.className} me-2`}");

for (const file of ["src/pages/ControlUsers/UsersTable.jsx", "src/pages/ControlUsers/UserCards.jsx"]) {
  let s = read(file);
  s = s.replace("  onInvite,\n  onToggleAdmin,\n", "");
  s = s.replace(/\n\s*onInvite=\{accounts\[user\.user_id\] \? undefined : onInvite\}/, "");
  s = s.replace(/\n\s*adminState=\{[\s\S]*?\}\n(\s*)onToggleAdmin=\{onToggleAdmin\}/, "");
  if (/onInvite|onToggleAdmin|adminState/.test(s)) throw new Error(`${file}: leftovers`);
  fs.writeFileSync(file, s);
}

// Boshqaruv: jadvaldan olingan, taklif tahrirlash oynasiga
const control = "src/pages/ControlUsers/ControlUsers.jsx";
cut(control, "  // ADMIN: ega hisobi bor xonadoshni boshqaruvchi qiladi", "  async function handleInvite(user) {");
edit(control, [
  [
    `      onInvite: handleInvite,
      // Faqat ega tayinlaydi
      onToggleAdmin: isOwner ? handleToggleAdmin : undefined,
    };`,
    `    };`,
  ],
  [
    `        account={selectedUser ? accounts[selectedUser.user_id] : undefined}
        canManageRoles={isOwner}`,
    `        account={selectedUser ? accounts[selectedUser.user_id] : undefined}
        canManageRoles={isOwner}
        onInvite={(user) => {
          closeUserModal();
          handleInvite(user);
        }}`,
  ],
]);

// Tahrirlash oynasi: hisobsiz xonadoshga "Taklif havolasi" tugmasi
const modal = "src/components/UserModal/UserModal.jsx";
edit(modal, [
  [
    `  account,
  canManageRoles = false,
}) => {`,
    `  account,
  canManageRoles = false,
  onInvite,
}) => {`,
  ],
  [
    `                  {!account && <p className="small text-muted m-0">{t("userModal.rightsNoAccount")}</p>}`,
    `                  {!account && (
                    <>
                      <p className="small text-muted mb-2">{t("userModal.rightsNoAccount")}</p>

                      {onInvite && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={() => onInvite(selectedUser)}
                          disabled={saving}
                        >
                          <AppIcon name="send" className="me-1" />
                          {t("userModal.inviteLink")}
                        </button>
                      )}
                    </>
                  )}`,
  ],
]);

console.log("ok");
