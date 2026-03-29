import type { ComponentPropsWithoutRef } from "react";

type PlatformTextAreaProps = ComponentPropsWithoutRef<"textarea"> & {
  "data-platform-foundation"?: string;
};

export function PlatformTextArea({
  className,
  "data-platform-foundation": foundationMarker,
  ...props
}: PlatformTextAreaProps) {
  return (
    <textarea
      {...props}
      className={className}
      data-platform-foundation={foundationMarker ?? "platform-textarea"}
    />
  );
}
