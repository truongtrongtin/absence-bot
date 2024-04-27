import { GlobalShortcutLazyHandler } from "slack-edge";
import { findMemberById } from "../helpers";
import { createAbsenceView } from "../user-interface/createAbsenceView";

export const showCreateAbsenceModalFromGlobalShortcut: GlobalShortcutLazyHandler =
  async ({ context, payload }) => {
    await context.client.views.open({
      trigger_id: payload.trigger_id,
      view: createAbsenceView(payload.user.id),
    });

    const foundMember = findMemberById(payload.user.id);
    if (!foundMember) throw Error("member not found");
    console.log(
      `${foundMember.name} is opening new absence modal from global shortcut`
    );
  };
