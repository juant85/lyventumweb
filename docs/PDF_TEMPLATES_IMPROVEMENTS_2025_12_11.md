# Pending Improvements: PDF Templates
**Date:** December 11, 2025

This document tracks the pending improvements and refinements required for the PDF Reporting functionality (Phase 4).

## 1. Verification & Testing
- [ ] **End-to-End Verification**: Validate that the "Executive" and "Detailed" reports generate correctly with real data.
- [ ] **Chart Rendering**: Ensure that charts (Attendance Trend, Booth Traffic) are correctly captured and embedded in the PDF without cutting off labels or legends.

## 2. Template Enhancements
- [ ] **Dynamic Layouts**: Review if the current `autoTable` layouts handle extremely long text (e.g., long session names or booth descriptions) gracefully without breaking the layout.
- [ ] **Custom Sections**: Consider allowing users to toggle specific sub-sections within a template (e.g., include "Booth Performance" but exclude "Lead Generation").
- [ ] **New Templates**:
    -   *Sponsor ROI Report*: A dedicated template focusing purely on scanner numbers and lead quality for sponsors.
    -   *Staff Performance*: A report detailing internal staff activity if applicable.

## 3. Branding & Styling
- [ ] **Font Customization**: Currently using standard Helvetica. Investigate supporting custom fonts if requested by premium clients.
- [ ] **Color Themes**: Verify that the `primaryColor` and `secondaryColor` form inputs allow for full customization of the report's accent bars and table headers.

## 4. Performance
- [ ] **Large Datasets**: Test PDF generation with 1000+ attendees and 50+ booths to ensure the browser doesn't freeze during the `jspdf` generation process.
