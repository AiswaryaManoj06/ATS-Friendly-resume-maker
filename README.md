# ATS Friendly Resume Maker

**ATS Friendly Resume Maker** is an end-to-end web application built with **Angular (Standalone Architecture)** and **Reactive Forms**. Designed to bridge the gap between job seekers and automated applicant tracking systems (ATS), it streamlines resume creation, keyword optimization, and professional PDF generation into a unified workflow.

---

## 🌟 Key Highlights & Features

- **Robust Angular Reactive Forms**: Comprehensive form control bindings, nested `FormGroup`s, and dynamic `FormArray`s with real-time validation tracking (`touched`, `dirty`, `valid`, `invalid`).
- **Custom 6-Digit Pincode Validator**: Dedicated Angular validator enforcing exact 6-digit numeric postal codes.
- **Dynamic FormArrays**: Add, edit, and delete multiple career records dynamically:
  - **Work Experience**: With nested tenure group (`Date of Joining` & `Date of Resign`).
  - **Key Projects**: Title, tech stack, and descriptions.
  - **Education**: School/College, degree, year range, and grade.
  - **Certifications & Achievements**: Courses, hackathons, and research publications.
  - **References**: Professional mentor and lead contacts.
- **Candidate Headshot Integration**: Instant photo uploading, file-to-Data URL conversion, and circular preview rendering.
- **Executive Single-Column Resume Template**: Renders the exact resume format with deep teal accents (`#0e6251`), warm dividers (`#d4b08c`), 2-column skills grid, and right-aligned dates.
- **Intelligent ATS Scoring & 1-Click Optimizer**:
  - Computes real-time ATS match compatibility (0–100%).
  - Identifies **Matched Keywords** vs. **Missing Keywords**.
  - Provides actionable suggestions with estimated point gains.
  - **⚡ 1-Click Auto-Optimize**: Infuses missing technical keywords into relevant skills categories and aligns the career objective statement with target roles.
- **🖨️ 1-Click Print & PDF Export**: Clean `@media print` rules for margin-accurate A4 PDF generation.

---

## 🛠️ Tech Stack

- **Framework**: Angular (Standalone Components)
- **Forms**: Angular Reactive Forms (`FormGroup`, `FormArray`, `FormControl`, `Validators`)
- **Styling**: Vanilla CSS with modern custom design tokens and `@media print`
- **Build Tool**: Angular CLI & Vite

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
# Clone the repository
git clone https://github.com/AiswaryaManoj06/ATS-Friendly-resume-maker.git

# Navigate to project directory
cd ATS-Friendly-resume-maker

# Install dependencies
npm install
```

### Running Locally
```bash
npm start
# or
npx ng serve --port 4300
```
Open [http://localhost:4300](http://localhost:4300) in your browser.

### Building for Production
```bash
npm run build
```
Production assets will be built in the `dist/` directory.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
