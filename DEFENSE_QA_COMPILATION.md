# ERMEL System Defense Reviewer

## How to Use This File
- Read each answer as a guide, not a script.
- Keep your oral response within 30 to 60 seconds unless asked to elaborate.
- Support claims with your implemented modules: quotation, reservation, payment verification, notification, and DSS analytics.

## A. Chapter I: Introduction, Problem, Objectives

### 1) Why is a web-based solution necessary now instead of improving the manual process?
**Suggested Answer:**
Manual processing is no longer reliable for growing transaction volume because records become fragmented and status follow-ups are delayed. A web-based system centralizes data, provides 24/7 customer access, and enables real-time tracking for both customer and admin, which manual logs cannot sustain efficiently.

### 2) What concrete operational failures did you observe in the manual setup?
**Suggested Answer:**
The common issues were inconsistent quotation records, delayed response to inquiries, difficulty tracking reservation queues, and communication gaps in payment and status updates. These failures directly affect service speed and customer trust.

### 3) Why do you classify your system as both TPS and DSS?
**Suggested Answer:**
It is a TPS because it processes day-to-day transactions such as quote requests, reservations, payment-proof submission, verification, and notifications. It is a DSS because it analyzes historical data to generate projected income, restocking recommendations, and material popularity insights for managerial decisions.

### 4) What is your exact system scope?
**Suggested Answer:**
The scope covers customer inquiry, quotation request, reservation scheduling, admin review and adjustment, payment-proof handling, status tracking, and automated notifications until installation readiness. Actual physical fabrication and on-site installation execution remain operational activities outside the software.

### 5) How do your research questions map to your objectives?
**Suggested Answer:**
Research Question 1 maps to Objective 1 on web reservation and quotation. Research Question 2 maps to Objective 2 on DSS and recommendations. Research Question 3 maps to Objective 3 on workflow integration across quotation, reservation, payment, and notification.

### 6) Why include predictive analytics in the first version?
**Suggested Answer:**
Because the business pain point is not only transaction handling but also planning uncertainty. Including DSS early ensures the system is not just operationally efficient but also decision-oriented, helping prevent stockouts and poor scheduling.

### 7) How does your system address fragmented records and delayed responses?
**Suggested Answer:**
It uses one centralized database and a unified workflow so all updates are reflected in one system state. Automated status notifications reduce manual follow-up delays.

### 8) What assumptions did you make about user readiness?
**Suggested Answer:**
We assumed users have basic mobile or desktop internet access and can perform simple online form submission. To support this, we designed straightforward UI flow and clear status feedback.

### 9) How do you define dependable booking in measurable terms?
**Suggested Answer:**
Dependable booking means reservations are validated against scheduling rules, conflicts are prevented, required data is complete, and the reservation status is traceable by both customer and admin throughout the process.

### 10) What risk exists if the integrated TPS-DSS approach is not adopted?
**Suggested Answer:**
The business remains reactive, causing repeated scheduling conflicts, inconsistent quotation handling, avoidable administrative errors, and weak data basis for planning procurement and staffing.

## B. Chapter II: Review of Related Literature

### 11) Which study most influenced your reservation conflict logic?
**Suggested Answer:**
Studies discussing overlap detection and schedule conflict prevention guided our logic. We implemented practical runtime conflict checks to ensure no overlapping reservation slot is accepted.

### 12) Did you use overlap checking or slot locking?
**Suggested Answer:**
Our core approach is overlap checking before final reservation acceptance, combined with controlled status flow to avoid duplicate confirmations.

### 13) How did UX literature translate to your implementation?
**Suggested Answer:**
We simplified user flow into guided steps: customer info, category, materials, dimensions, reservation date, and summary. This reduces cognitive load and improves completion rate.

### 14) Why is there a minimum lead time for reservation?
**Suggested Answer:**
Lead time protects operational feasibility. It gives sufficient buffer for validation, planning, and material preparation before installation-related activities.

### 15) How did you adapt security practices from literature?
**Suggested Answer:**
We used secure authentication and role-based controls, validated inputs, and protected transactional flow. This aligns with SSDLC principles where security is embedded from design to deployment.

### 16) What literature gap does your study address?
**Suggested Answer:**
Many systems focus only on booking or only on inventory. Our work integrates quotation, reservation, payment verification, notifications, and DSS in one SME-focused platform for glass and aluminum operations.

### 17) How did you connect reservation, inventory behavior, and analytics?
**Suggested Answer:**
Reservations and quotations generate demand signals. DSS analyzes these historical patterns to forecast likely material needs and projected income, enabling proactive planning.

### 18) Why cite PHP/MySQL studies if your stack is React/Node/PostgreSQL?
**Suggested Answer:**
Those studies provide transferable architectural and quality insights. We adopted the same core principles while implementing them with our chosen modern stack.

### 19) What theory supports historical-data-based recommendations?
**Suggested Answer:**
Demand forecasting and descriptive trend analysis support using historical transactions to estimate near-term demand and identify high-frequency materials.

### 20) How does your synthesis support the proposed system design?
**Suggested Answer:**
The synthesis shows that usability, conflict-free scheduling, integrated data flow, and security are interdependent. Predictive modeling then builds on this foundation for better management decisions.

## C. System Design and Technical Defense

### 21) Explain your end-to-end workflow.
**Suggested Answer:**
Customer submits quote request with details, category, materials, dimensions, and preferred reservation date. Admin reviews and finalizes quote, approves or adjusts schedule, customer tracks status, payment proof is submitted when enabled, admin verifies payment, and status updates are notified until installation readiness.

### 22) How do you prevent double booking?
**Suggested Answer:**
Before confirming a reservation, the system checks whether the requested schedule overlaps with existing approved or occupied slots. Conflicting schedules are rejected or rerouted for alternative date selection.

### 23) What if two users book similar slots simultaneously?
**Suggested Answer:**
The backend performs final validation on submission. Even if requests arrive close in time, the first valid confirmed record blocks the slot and subsequent conflicting requests are not confirmed.

### 24) How is quotation computed?
**Suggested Answer:**
The system uses category, selected materials, and dimensions to produce an initial estimate. Final business-accurate quotation is admin-adjustable to handle special conditions and edge cases.

### 25) Why allow manual category/material input?
**Suggested Answer:**
It prevents user drop-off when predefined options are incomplete and supports real-world variability in custom project requests.

### 26) Why is admin override necessary?
**Suggested Answer:**
Automated estimates are useful for speed, but custom fabrication has exceptions. Admin override preserves pricing accuracy, protects margins, and ensures operational feasibility.

### 27) How are permissions enforced?
**Suggested Answer:**
Customer users are restricted to their own request and status functions, while admins handle approvals, adjustments, verification, and analytics. Role-based authorization checks enforce this separation.

### 28) How do you protect sensitive data and payment proofs?
**Suggested Answer:**
We apply authenticated access controls, validation, and controlled file handling workflow. Only authorized roles can view and verify payment-related records.

### 29) What is validated client-side vs server-side?
**Suggested Answer:**
Client-side validation improves user experience and catches incomplete fields early. Server-side validation is the final authority for all critical data and rule enforcement to prevent tampering.

### 30) How do you keep actions traceable?
**Suggested Answer:**
Key workflow state changes such as quote adjustment, reservation decision, and payment verification are persisted with status progression, allowing transparent tracking and review.

## D. Chapter IV: Results and Discussion

### 31) What proves Objective 1 beyond screenshots?
**Suggested Answer:**
Objective 1 is evidenced by working multi-step quote and booking flow, immediate estimate generation, and admin finalization controls that align with real process requirements.

### 32) Did you check quotation reliability?
**Suggested Answer:**
Yes, the design intentionally combines automatic preliminary estimate plus admin final validation to maintain practical reliability for custom installations.

### 33) What DSS outputs were implemented?
**Suggested Answer:**
Projected income, restocking recommendations, and category-based popular material insights were implemented for admin decision support.

### 34) Why is DSS useful operationally?
**Suggested Answer:**
It shifts planning from guesswork to evidence-based decisions, improving procurement timing, reducing stockout risk, and supporting queue and manpower preparation.

### 35) How do you handle sparse or volatile data?
**Suggested Answer:**
Forecast outputs are treated as decision aids, not absolute truth. Admin judgment remains part of final decisions, especially in unusual seasonal patterns.

### 36) What confirms Objective 3 integration success?
**Suggested Answer:**
A unified status-tracking and notification flow connects inquiry, quotation approval, reservation, payment enablement, and verification in one coherent process.

### 37) What is the benefit of automated notifications?
**Suggested Answer:**
It reduces manual follow-up workload and keeps customers informed at each stage, improving transparency and trust.

### 38) What major implementation challenge did you face?
**Suggested Answer:**
The main challenge was aligning customer convenience with admin control. We addressed this by combining automated steps with approval gates for sensitive business decisions.

### 39) How did integration reduce human error?
**Suggested Answer:**
By replacing scattered manual logs with centralized records and rule-based transitions, the system minimizes missed updates, duplicate scheduling, and inconsistent status communication.

### 40) Why is this considered a complete workflow solution?
**Suggested Answer:**
Because it does not stop at booking; it links estimation, scheduling, verification, tracking, and analytics from inquiry to installation readiness.

## E. Chapter V: Conclusion and Recommendation

### 41) Are your conclusions evidence-based?
**Suggested Answer:**
Yes. Each conclusion corresponds to a delivered objective: functioning quote-reservation module, operational DSS outputs, and integrated workflow with automated status updates.

### 42) Which recommendation should be prioritized first?
**Suggested Answer:**
Comprehensive staff training should come first because system value depends on correct and consistent usage by daily operators.

### 43) Why is routine maintenance critical?
**Suggested Answer:**
As transactions grow, performance and security risks increase. Routine optimization and patch management preserve speed, reliability, and data protection.

### 44) Why propose supplier integration as future work?
**Suggested Answer:**
The current DSS already estimates demand. Supplier integration is a logical next step to automate procurement planning and further reduce manual workload.

### 45) How do you avoid overstating your contribution?
**Suggested Answer:**
We present the system as an implemented and evaluated operational solution for the target business context, while acknowledging future expansion opportunities.

### 46) What are your study limitations?
**Suggested Answer:**
Limitations include business-context specificity, dependence on data quality for analytics, and the need for sustained user adoption and training for full long-term impact.

### 47) How generalizable is your system?
**Suggested Answer:**
Core architecture is reusable for similar SME service workflows, but business rules, pricing logic, and material categories need localization per company.

### 48) What KPI should be tracked post-deployment?
**Suggested Answer:**
Reservation completion rate, quote turnaround time, scheduling conflict rate, payment verification turnaround time, and forecast alignment with actual usage.

### 49) What one-year improvement path do you recommend?
**Suggested Answer:**
Prioritize hardening security and performance, expand analytics depth, and consider supplier-side integration with controlled rollout.

### 50) What is your strongest practical contribution?
**Suggested Answer:**
Delivering one integrated platform that connects customer booking convenience and owner-level operational decision support for a specialized SME workflow.

## F. Hard Panel Questions With Defensive Answers

### 51) If forecasts are wrong, who is accountable?
**Suggested Answer:**
The DSS is a support tool, not an autonomous decision-maker. Final procurement and scheduling decisions remain managerial, with forecasts serving as evidence inputs.

### 52) How do you prevent bad recommendations from bad data?
**Suggested Answer:**
We enforce consistent transaction recording and treat recommendations with admin oversight. Better data hygiene directly improves model usefulness.

### 53) Does admin override weaken automation credibility?
**Suggested Answer:**
No. In custom construction contexts, override is a control feature that ensures financial and operational correctness in edge cases.

### 54) Can your system scale to higher demand?
**Suggested Answer:**
Yes, the modular web architecture and centralized database design support scaling, with future optimization focused on query performance and infrastructure sizing.

### 55) What if the server goes down during active operations?
**Suggested Answer:**
Transactions should rely on persisted backend state and recovery procedures. Operationally, backup and restore planning is part of deployment readiness.

### 56) How do you address data privacy concerns?
**Suggested Answer:**
Through controlled access, role-based restrictions, secure authentication, and disciplined handling of personal and payment-related records.

### 57) Why is this academically valid and not just software coding?
**Suggested Answer:**
The work is grounded in identified business problems, literature-supported design decisions, objective-driven implementation, and evidence-based discussion of outcomes.

### 58) What evidence would falsify your claim of improvement?
**Suggested Answer:**
If conflict rates, response delays, and tracking errors remain unchanged after adoption, then the system would not have achieved its intended operational impact.

### 59) If one module must be removed, which one and why?
**Suggested Answer:**
The DSS could be temporarily removed while preserving core TPS operations, because transactional continuity is the minimum business-critical function.

### 60) In one sentence, what is your thesis value?
**Suggested Answer:**
Our thesis delivers a secure, integrated web system that digitizes end-to-end reservation and order processing while adding predictive insights for smarter business decisions.

## G. Rapid-Fire Questions (Very Common in Oral Defense)

### 61) Why this title?
**Suggested Answer:**
Because the system combines transaction processing for operations and predictive analytics for managerial decisions in one platform.

### 62) Who benefits most?
**Suggested Answer:**
Both customers and owner-admins: customers gain convenience and transparency, admins gain control and planning insights.

### 63) What innovation did your group add?
**Suggested Answer:**
Unified TPS-DSS architecture tailored to glass and aluminum workflow, not just isolated booking or inventory functions.

### 64) What is your competitive advantage versus manual setup?
**Suggested Answer:**
Speed, traceability, reduced errors, and data-based planning.

### 65) What feature are you most confident defending?
**Suggested Answer:**
The integrated status-driven workflow from quote to payment readiness with admin-controlled finalization.

### 66) What feature needs future enhancement?
**Suggested Answer:**
Supplier integration and more advanced forecasting depth.

### 67) What would you improve first after defense?
**Suggested Answer:**
Operational monitoring dashboard with KPI alerts and tighter analytics explainability.

### 68) What if users resist the new system?
**Suggested Answer:**
Use phased onboarding, practical training, and role-specific support to reduce transition friction.

### 69) What is your fallback if internet is unstable?
**Suggested Answer:**
Operationally, staff can queue pending actions and sync once connectivity resumes, while preserving backend data consistency.

### 70) Final panel question: Why should we approve this study?
**Suggested Answer:**
Because it addresses a real SME problem with a working, secure, and integrated solution supported by literature, clear objectives, and demonstrated outcomes.

---

## 30-Second Master Closing Statement
Our study designed and implemented a Web-Based Service Reservation and Order Management System with Predictive Analytics tailored for Ermel’s Glass and Aluminum Works. It resolves core manual-process issues by integrating quotation, reservation, payment verification, status notifications, and decision support in one platform. As a result, the business gains faster and more reliable operations while customers gain transparent and convenient service access.
