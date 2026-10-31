# EventSphere (C++ / SQLite / vanilla JS)

## Build and run (Ubuntu/WSL; on Windows use WSL or MSYS2 with the same packages)
    sudo apt install g++ cmake libsqlite3-dev libssl-dev curl
    ./setup.sh                      # downloads cpp-httplib + nlohmann/json headers
    cmake -S backend -B build && cmake --build build
    ADMIN_EMAIL=admin@college.edu ADMIN_PASSWORD=ChangeMe123 ./build/eventsphere
Open http://localhost:8080 (run from the project root; the server also serves the frontend).
The admin is created at startup from the env vars (dev only; use your own password, never commit it).

## Implemented
Signup/login/logout (PBKDF2-SHA256 salted hashes, HttpOnly session cookie), role checks on the server,
event proposals -> admin approve / reject / request changes (with history), organizer edit + re-review,
public listing of published events only, search + category filter, registration with unique ID,
duplicate prevention, closed/full checks, atomic capacity (BEGIN IMMEDIATE transaction), cancellation,
My Registrations, admin stats and category chart from real DB data.

## Roles and dashboards (two dashboards only)
- **Students / public**: browse published events without logging in; click Register to open that event's own registration form. The **Student Dashboard** lists tickets and certificates and has an in-app **camera scanner**: on the event day the student taps "Scan attendance QR", points the camera at the organizer's live QR, and attendance is marked (certificate issued automatically). If the camera is blocked, a photo of the QR can be uploaded instead. Browsers allow the camera only on HTTPS or localhost (run.sh prints an https:// phone link).
- **Organizer Dashboard**: only for approved organizers (overview, my events, create event, registrations with form answers, attendance and certificates).
- **Admin Dashboard**: organizer requests (approve/reject), organizers, events review, all registrations, attendance.
- Signup always creates a student. A student submits an *event creator request*; only an admin approval changes the role to `organizer`.
  Every API call re-checks the role in the database, so URLs/APIs cannot be used to skip approval.
- Registration forms: one template per category (Technical, Workshop, Cultural, Symposium, Sports, Seminar, Hackathon, Other),
  organizers can pick another template and add up to 8 extra questions. Answers are validated on the server and stored with the event and student.
- **Certificate authority (Organizer Dashboard > Certificate Authority)**: each organizer saves the authority name, designation and a signature image (PNG/JPG/WebP; the browser converts it to JPEG).
  Certificates for that organizer's events carry exactly that block, and one organizer's authority is never printed on another's certificates.
  Until an organizer saves an authority, attendance is still recorded but certificates for their events are held (students and the organizer are told);
  saving the authority issues all waiting certificates and emails them. Already-issued certificates keep the signature they were issued with.
  Optional site-wide fallback for organizers who set nothing: `CERT_AUTHORITY_NAME` / `CERT_AUTHORITY_TITLE` environment variables (or the admin API `/api/admin/certificate-settings`).

## Not yet implemented (next stages)
Waiting list, QR codes + scanner, PDF certificates + verification page, SMTP email delivery,
CSV export, rate limiting, automated tests, user management and profile pages.

## Frontend (React)
The UI is a React + Vite app. Source: `frontend-src/`. The compiled site is already built into `frontend/`,
so you do NOT need Node.js to run or deploy the app. To change the UI:
    cd frontend-src && npm install && npm run build      (outputs to ../frontend)
    npm run dev                                          (live reload; proxies /api to the C++ server on :8080)
