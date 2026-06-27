import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useForm, type Control } from "react-hook-form";
import { RHFField, RHFSelect, RHFCheckbox } from "../RHFField";

type FormShape = {
  text: string;
  choice: string;
  agree: boolean;
};

const defaults: FormShape = { text: "", choice: "", agree: false };

function Harness({
  render: renderChild,
  values,
}: Readonly<{ render: (control: Control<FormShape>) => React.ReactNode; values?: Partial<FormShape> }>) {
  const { control } = useForm<FormShape>({ defaultValues: { ...defaults, ...values } });
  return <form>{renderChild(control)}</form>;
}

const SELECT_OPTIONS = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

describe("RHFField", () => {
  it("renders the label and binds the value", () => {
    render(<Harness render={(control) => <RHFField control={control} name="text" label="Name" />} />);
    const input = screen.getByLabelText("Name") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "hello" } });
    expect(input.value).toBe("hello");
  });

  it("shows the hint when there is no error", () => {
    render(<Harness render={(control) => <RHFField control={control} name="text" label="Name" hint="Type here" />} />);
    expect(screen.getByText("Type here")).toBeInTheDocument();
  });

  it("shows the error (taking precedence over the hint) and flags the field invalid", () => {
    render(
      <Harness
        render={(control) => <RHFField control={control} name="text" label="Name" hint="Type here" error="Required" />}
      />,
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.queryByText("Type here")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
  });

  it("supports the multiline + type + placeholder + disabled props", () => {
    render(
      <Harness
        render={(control) => (
          <RHFField
            control={control}
            name="text"
            label="Bio"
            type="email"
            placeholder="you@example.com"
            multiline
            disabled
            autoComplete="email"
          />
        )}
      />,
    );
    const input = screen.getByLabelText("Bio") as HTMLTextAreaElement;
    expect(input.tagName).toBe("TEXTAREA");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("placeholder", "you@example.com");
    expect(input).toHaveAttribute("autocomplete", "email");
  });

  it("accepts the optional margin prop (margin='none')", () => {
    const { container } = render(
      <Harness render={(control) => <RHFField control={control} name="text" label="Name" margin="none" />} />,
    );
    expect(container.querySelector(".MuiFormControl-marginDense")).toBeNull();
  });

  it("uses dense margin by default", () => {
    const { container } = render(
      <Harness render={(control) => <RHFField control={control} name="text" label="Name" />} />,
    );
    expect(container.querySelector(".MuiTextField-root.MuiFormControl-marginDense")).not.toBeNull();
  });

  it("coerces a nullish field value to an empty string", () => {
    render(
      <Harness
        values={{ text: undefined as unknown as string }}
        render={(control) => <RHFField control={control} name="text" label="Name" />}
      />,
    );
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("");
  });
});

describe("RHFSelect (searchable)", () => {
  const pick = () => screen.getByLabelText("Pick") as HTMLInputElement;

  it("lists options in a searchable combobox", () => {
    render(<Harness render={(control) => <RHFSelect control={control} name="choice" label="Pick" options={SELECT_OPTIONS} />} />);
    expect(pick()).toHaveAttribute("role", "combobox");
    fireEvent.change(pick(), { target: { value: "a" } });
    expect(screen.getByRole("option", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Beta" })).toBeInTheDocument();
  });

  it("selects an option and shows its label", () => {
    render(<Harness render={(control) => <RHFSelect control={control} name="choice" label="Pick" options={SELECT_OPTIONS} />} />);
    fireEvent.change(pick(), { target: { value: "Bet" } });
    fireEvent.click(screen.getByRole("option", { name: "Beta" }));
    expect(pick().value).toBe("Beta");
  });

  it("pre-selects the current value and matches it when opened", () => {
    render(<Harness values={{ choice: "b" }} render={(control) => <RHFSelect control={control} name="choice" label="Pick" options={SELECT_OPTIONS} />} />);
    expect(pick().value).toBe("Beta");
    // Open the listbox so the selected option is matched (isOptionEqualToValue).
    fireEvent.change(pick(), { target: { value: "Bet" } });
    expect(screen.getByRole("option", { name: "Beta" })).toBeInTheDocument();
  });

  it("clears the value back to empty", () => {
    render(<Harness values={{ choice: "b" }} render={(control) => <RHFSelect control={control} name="choice" label="Pick" options={SELECT_OPTIONS} />} />);
    expect(pick().value).toBe("Beta");
    fireEvent.click(screen.getByTitle("Clear"));
    expect(pick().value).toBe("");
  });

  it("shows the error and disables the field", () => {
    render(
      <Harness
        render={(control) => (
          <RHFSelect control={control} name="choice" label="Pick" options={SELECT_OPTIONS} error="Choose one" disabled margin="none" />
        )}
      />,
    );
    expect(screen.getByText("Choose one")).toBeInTheDocument();
    expect(pick()).toBeDisabled();
  });

  it("uses the empty label as the placeholder", () => {
    render(<Harness render={(control) => <RHFSelect control={control} name="choice" label="Pick" options={SELECT_OPTIONS} emptyLabel="None" />} />);
    expect(pick()).toHaveAttribute("placeholder", "None");
  });

  it("renders empty for a nullish field value", () => {
    render(
      <Harness
        values={{ choice: undefined as unknown as string }}
        render={(control) => <RHFSelect control={control} name="choice" label="Pick" options={SELECT_OPTIONS} />}
      />,
    );
    expect(pick().value).toBe("");
  });
});

describe("RHFCheckbox", () => {
  it("renders unchecked by default and toggles on click", () => {
    render(<Harness render={(control) => <RHFCheckbox control={control} name="agree" label="Agree" />} />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(screen.getByText("Agree")).toBeInTheDocument();
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });
});
