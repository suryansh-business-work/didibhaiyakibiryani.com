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

describe("RHFSelect", () => {
  it("renders the empty option (default label) plus all options", () => {
    render(
      <Harness
        render={(control) => <RHFSelect control={control} name="choice" label="Pick" options={SELECT_OPTIONS} />}
      />,
    );
    // Open the select to see the menu items.
    fireEvent.mouseDown(screen.getByLabelText("Pick"));
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("selects an option and reflects the value", () => {
    render(
      <Harness
        render={(control) => <RHFSelect control={control} name="choice" label="Pick" options={SELECT_OPTIONS} />}
      />,
    );
    fireEvent.mouseDown(screen.getByLabelText("Pick"));
    fireEvent.click(screen.getByText("Beta"));
    // The hidden input MUI keeps for the select carries the value.
    const hidden = document.querySelector('input[name="choice"]') as HTMLInputElement;
    expect(hidden.value).toBe("b");
  });

  it("shows the error and disables the field; a disabled select does not open", () => {
    render(
      <Harness
        render={(control) => (
          <RHFSelect
            control={control}
            name="choice"
            label="Pick"
            options={SELECT_OPTIONS}
            error="Choose one"
            disabled
            margin="none"
          />
        )}
      />,
    );
    expect(screen.getByText("Choose one")).toBeInTheDocument();
    expect(screen.getByLabelText("Pick")).toHaveAttribute("aria-disabled", "true");
    // A disabled select cannot open, so its menu items stay out of the DOM.
    fireEvent.mouseDown(screen.getByLabelText("Pick"));
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("renders a custom empty label", () => {
    render(
      <Harness
        render={(control) => (
          <RHFSelect control={control} name="choice" label="Pick" options={SELECT_OPTIONS} emptyLabel="None" />
        )}
      />,
    );
    fireEvent.mouseDown(screen.getByLabelText("Pick"));
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("coerces a nullish field value to an empty string", () => {
    render(
      <Harness
        values={{ choice: undefined as unknown as string }}
        render={(control) => <RHFSelect control={control} name="choice" label="Pick" options={SELECT_OPTIONS} />}
      />,
    );
    const hidden = document.querySelector('input[name="choice"]') as HTMLInputElement;
    expect(hidden.value).toBe("");
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
