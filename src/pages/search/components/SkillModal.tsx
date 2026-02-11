import CloseIcon from "@mui/icons-material/Close";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

interface SkillModalProps {
  isOpen: boolean;
  skillName?: string;
  onClose: () => void;
  onConfirm: () => void;
  isConfirmed: boolean;
}

/**
 * Modal that appears when landing on a skill node.
 * Prompts user to confirm they have obtained the skill before proceeding.
 *
 * @param props - Component props.
 * @param props.isOpen - Whether the modal is open.
 * @param props.skillName - The name of the skill node.
 * @param props.onClose - Callback when modal is closed.
 * @param props.onConfirm - Callback when user confirms the skill.
 * @param props.isConfirmed - Whether the user has confirmed the skill.
 * @returns The rendered skill modal dialog.
 */
export function SkillModal({
  isOpen,
  skillName,
  onClose,
  onConfirm,
  isConfirmed,
}: SkillModalProps): ReactNode {
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
        Skill Assessment
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ marginLeft: "auto" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="body1">
          A new tab should have opened with instructions on practicing and
          testing this skill.
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {skillName && `Skill: ${skillName}`}
        </Typography>

        <RadioGroup>
          <FormControlLabel
            control={
              <Radio
                checked={isConfirmed}
                onChange={onConfirm}
                value="confirmed"
              />
            }
            label="I am confident I have obtained this skill"
          />
        </RadioGroup>

        {isConfirmed && (
          <Typography variant="body2" color="success.main">
            You may now close this modal.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
