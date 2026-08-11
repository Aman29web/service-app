import React, { forwardRef } from "react";

const Input = forwardRef(
  (
    {
      label,
      name,
      type = "text",
      placeholder = "",
      value,
      onChange,
      onBlur,
      error = "",
      helperText = "",
      required = false,
      disabled = false,
      readOnly = false,
      className = "",
      inputClassName = "",
      rows = 4,
      ...props
    },
    ref
  ) => {
    const inputId = props.id || name;

    const baseClasses = `
      w-full
      rounded-lg
      border
      bg-white
      px-3.5
      py-2.5
      text-sm
      text-slate-900
      outline-none
      transition
      placeholder:text-slate-400
      disabled:cursor-not-allowed
      disabled:bg-slate-100
      disabled:text-slate-500
      read-only:bg-slate-50
      focus:ring-2
    `;

    const borderClasses = error
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 focus:border-blue-500 focus:ring-blue-100";

    const commonProps = {
      id: inputId,
      name,
      ref,
      value,
      onChange,
      onBlur,
      placeholder,
      disabled,
      readOnly,
      required,
      className: `${baseClasses} ${borderClasses} ${inputClassName}`,
      ...props,
    };

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}

            {required && (
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {type === "textarea" ? (
          <textarea {...commonProps} rows={rows} />
        ) : (
          <input type={type} {...commonProps} />
        )}

        {error ? (
          <p className="mt-1.5 text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;