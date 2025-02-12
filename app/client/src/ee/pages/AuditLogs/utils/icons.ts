export type IconInfo = [/* iconName */ string, /* iconFillColor */ string];

export const EVENT_ICON_MAP: Record<string, IconInfo> = {
  cloned: ["duplicate", ""],
  copied: ["duplicate", ""],
  created: ["add-box-line", ""],
  deleted: ["delete", "var(--ads-v2-color-fg-error)"],
  deployed: ["rocket", ""],
  duplicated: ["duplicate", ""],
  executed: ["execute", ""],
  exported: ["download-line", ""],
  forked: ["fork-2", ""],
  imported: ["upload-line", ""],
  invited: ["mail-check-line", ""],
  logged_in: ["login", ""],
  logged_out: ["logout", ""],
  signed_up: ["user-follow-line", ""],
  updated: ["edit-box-line", ""],
  viewed: ["eye-on", ""],
  invite_users: ["user-shared-line", ""],
  remove_users: ["user-received-2-line", "var(--ads-v2-color-fg-error)"],
  assigned_users: ["user-add-line", ""],
  unassigned_users: ["user-unfollow-line", "var(--ads-v2-color-fg-error)"],
  assigned_groups: ["user-add-line", ""],
  unassigned_groups: ["user-unfollow-line", "var(--ads-v2-color-fg-error)"],
};
