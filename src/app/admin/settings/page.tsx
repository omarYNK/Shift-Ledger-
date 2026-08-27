import { prisma } from "@/lib/prisma";
import { updateSettings } from "@/lib/actions/settings-actions";

export default async function SettingsPage() {
  const settings = await prisma.businessSettings.findUnique({ where: { id: 1 } });

  return (
    <div className="card">
      <h2>Business settings</h2>
      <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
        Shown as the letterhead on generated invoices.
      </p>
      <form action={updateSettings}>
        <div className="form-row">
          <label htmlFor="businessName">Business name</label>
          <input id="businessName" name="businessName" defaultValue={settings?.businessName ?? ""} required />
        </div>
        <div className="form-row">
          <label htmlFor="businessInfo">Address / contact (one line each)</label>
          <textarea
            id="businessInfo"
            name="businessInfo"
            rows={4}
            defaultValue={settings?.businessInfo ?? ""}
            placeholder={"123 Main St\nCity, ST 00000\nphone@example.com"}
          />
        </div>
        <button type="submit" className="btn-primary">Save</button>
      </form>
    </div>
  );
}
