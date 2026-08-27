import { switchUser } from "@/lib/actions/identity-actions";

export function SwitchUserLink() {
  return (
    <form action={switchUser}>
      <button type="submit" className="btn-sm">Switch user</button>
    </form>
  );
}
