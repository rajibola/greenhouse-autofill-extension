type Candidate = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  education: {
    school: string;
    degree: string;
    field: string;
    endDate: string;
  }[];
  experience: {
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  resumePath: string;
};

interface ReactProps {
  onChange?: (event: {
    target: { value: string };
    currentTarget: { value: string };
    preventDefault: () => void;
  }) => void;
}

interface HTMLElementWithReactProps extends HTMLElement {
  [key: string]: unknown;
}

type CandidateStringKey = {
  [K in keyof Candidate]: Candidate[K] extends string ? K : never;
}[keyof Candidate];

const fieldMappings: {
  [key: string]: CandidateStringKey | ((candidate: Candidate) => string);
} = {
  'input[name*="first_name" i]': "firstName",
  'input[name*="last_name" i]': "lastName",
  'input[name*="email" i]': "email",
  'input[name*="phone" i]': "phone",
  'input[name*="school" i]': (candidate: Candidate) =>
    candidate.education[0].school,
  'input[name*="degree" i]': (candidate: Candidate) =>
    candidate.education[0].degree,
  'input[name*="field_of_study" i]': (candidate: Candidate) =>
    candidate.education[0].field,
  'input[name*="education_end_date" i]': (candidate: Candidate) =>
    candidate.education[0].endDate,
  'input[name*="company" i]': (candidate: Candidate) =>
    candidate.experience[0].company,
  'input[name*="job_title" i]': (candidate: Candidate) =>
    candidate.experience[0].title,
  'input[name*="start_date" i]': (candidate: Candidate) =>
    candidate.experience[0].startDate,
  'input[name*="end_date" i]': (candidate: Candidate) =>
    candidate.experience[0].endDate,
  'textarea[name*="description" i]': (candidate: Candidate) =>
    candidate.experience[0].description,
};

// Additional selectors specific to Greenhouse job boards
const additionalSelectors = {
  firstName: [
    "#first_name",
    'input[name="job_application[first_name]"]',
    'input[data-field="first_name"]',
  ],
  lastName: [
    "#last_name",
    'input[name="job_application[last_name]"]',
    'input[data-field="last_name"]',
  ],
  email: [
    "#email",
    'input[name="job_application[email]"]',
    'input[data-field="email"]',
  ],
  phone: [
    "#phone",
    'input[name="job_application[phone]"]',
    'input[data-field="phone"]',
  ],
};

function simulateUserInput(element: HTMLElement, value: string) {
  // Focus the element
  element.focus();

  // Set the value using multiple approaches
  (element as HTMLInputElement).value = value;
  element.setAttribute("value", value);

  // Create and dispatch events that mimic real user input
  const events = [
    new Event("focus", { bubbles: true }),
    new Event("focusin", { bubbles: true }),
    new InputEvent("beforeinput", { bubbles: true, data: value }),
    new InputEvent("input", { bubbles: true, data: value }),
    new Event("change", { bubbles: true }),
    new Event("blur", { bubbles: true }),
    new Event("focusout", { bubbles: true }),
  ];

  // Dispatch events with proper timing
  events.forEach((event, index) => {
    setTimeout(() => {
      element.dispatchEvent(event);
    }, index * 50); // Add small delays between events
  });

  // Force React to update by accessing the element's properties
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

function findElementBySelectors(selectors: string[]): HTMLElement | null {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element as HTMLElement;
  }
  return null;
}

function fillField(element: HTMLElement, value: string) {
  console.log(`Attempting to fill field:`, element, `with value:`, value);

  try {
    // Try multiple approaches to set the value
    simulateUserInput(element, value);

    // For React-controlled inputs, try to update the internal state
    const reactKey = Object.keys(element).find((key) =>
      key.startsWith("__reactProps$")
    );
    if (reactKey) {
      const reactProps = (element as HTMLElementWithReactProps)[
        reactKey
      ] as ReactProps;
      if (reactProps.onChange) {
        reactProps.onChange({
          target: { value },
          currentTarget: { value },
          preventDefault: () => {},
        });
      }
    }
  } catch (error) {
    console.error("Error filling field:", error);
  }
}

function findFormFields() {
  const strategies = [
    // Strategy 1: Direct attribute matching
    (selector: string) => document.querySelectorAll(selector),
    // Strategy 2: Data attribute matching
    (selector: string) =>
      document.querySelectorAll(
        `[data-field*="${selector.replace(/[^\w\s]/g, "").toLowerCase()}"]`
      ),
    // Strategy 3: Label text matching
    (selector: string) => {
      const labels = Array.from(document.getElementsByTagName("label"));
      return labels
        .filter((label) =>
          label.textContent
            ?.toLowerCase()
            .includes(selector.replace(/[^\w\s]/g, "").toLowerCase())
        )
        .map((label) => {
          const input = label.getAttribute("for")
            ? document.getElementById(label.getAttribute("for")!)
            : label.querySelector("input, textarea");
          return input;
        })
        .filter(Boolean);
    },
  ];

  return strategies;
}

async function autofillForm(candidate: Candidate) {
  console.log("Starting autofill process...", candidate);

  if (candidate.resumePath) {
    try {
      const fileInputs = document.querySelectorAll('input[type="file"]');
      for (const fileInput of fileInputs) {
        // Check if the input is specifically for resumes
        const isResumeInput = checkIfResumeInput(fileInput);
        if (!isResumeInput) {
          continue; // Skip if not a resume input
        }

        const base64Data = candidate.resumePath.split(",")[1];
        const mimeType = candidate.resumePath
          .split(",")[0]
          .split(":")[1]
          .split(";")[0];
        const byteCharacters = atob(base64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: mimeType });
        const file = new File([blob], "resume.pdf", { type: mimeType });

        // Create a DataTransfer object and add the file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        // Set the files property of the file input
        const input = fileInput as HTMLInputElement;
        input.files = dataTransfer.files;

        // Dispatch change event
        const event = new Event("change", { bubbles: true });
        input.dispatchEvent(event);

        console.log("Resume file uploaded");
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
    }
  }

  // Continue with the rest of the form filling

  // First try the additional selectors for basic fields
  Object.entries(additionalSelectors).forEach(([field, selectors]) => {
    const element = findElementBySelectors(selectors);
    if (element) {
      console.log(`Found element for ${field} using additional selectors`);
      fillField(element, candidate[field as keyof Candidate] as string);
    }
  });

  // Then try the regular field mappings
  const strategies = findFormFields();
  Object.entries(fieldMappings).forEach(([selector, field]) => {
    let filled = false;

    strategies.forEach((strategy) => {
      if (!filled) {
        const elements = strategy(selector);
        if (elements && elements.length > 0) {
          elements.forEach((element) => {
            if (element) {
              const value =
                typeof field === "function"
                  ? field(candidate)
                  : candidate[field as CandidateStringKey];
              console.log(`Filling ${selector} with ${value}`);
              fillField(element as HTMLElement, value);
              filled = true;
            }
          });
        }
      }
    });
  });

  // Handle resume upload
  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput) {
    (fileInput as HTMLElement).style.border = "2px solid #22c55e";
    fileInput.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Check for any React-specific form elements
  setTimeout(() => {
    document.querySelectorAll("input, textarea").forEach((element) => {
      const reactKey = Object.keys(element).find((key) =>
        key.startsWith("__reactProps$")
      );
      if (reactKey) {
        const name = element.getAttribute("name")?.toLowerCase() || "";
        Object.entries(fieldMappings).forEach(([selector, field]) => {
          if (name.includes(selector.replace(/[^\w\s]/g, "").toLowerCase())) {
            const value =
              typeof field === "function" ? field(candidate) : candidate[field];
            fillField(element as HTMLElement, value);
          }
        });
      }
    });
  }, 500);
}

// Add this new helper function above the autofillForm function
function checkIfResumeInput(input: Element): boolean {
  // Check the input element and its parent elements for resume-related indicators
  const elementToCheck = input.closest("div, label, fieldset") || input;
  const textContent = elementToCheck.textContent?.toLowerCase() || "";
  const inputId = (input as HTMLElement).id?.toLowerCase() || "";
  const inputName = input.getAttribute("name")?.toLowerCase() || "";
  const ariaLabel = input.getAttribute("aria-label")?.toLowerCase() || "";

  // Resume-related keywords
  const resumeKeywords = ["resume", "cv", "curriculum vitae"];
  // Cover letter keywords to exclude
  const coverLetterKeywords = ["cover letter", "coverletter", "letter"];

  // Check if any resume keywords are present
  const hasResumeKeyword = resumeKeywords.some(
    (keyword) =>
      textContent.includes(keyword) ||
      inputId.includes(keyword) ||
      inputName.includes(keyword) ||
      ariaLabel.includes(keyword)
  );

  const hasCoverLetterKeyword = coverLetterKeywords.some(
    (keyword) =>
      textContent.includes(keyword) ||
      inputId.includes(keyword) ||
      inputName.includes(keyword) ||
      ariaLabel.includes(keyword)
  );

  return hasResumeKeyword && !hasCoverLetterKeyword;
}

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.type === "AUTOFILL") {
    console.log("Received autofill message", message);
    autofillForm(message.candidate);
    sendResponse({ success: true });
  }
  return true;
});
