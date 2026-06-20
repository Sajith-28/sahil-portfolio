"""
Contact form API route.
Accepts POST requests, validates with Pydantic, persists to MongoDB,
and sends email notifications synchronously via SMTP using fastapi-mail.
"""

import os
import html
from datetime import datetime
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from database import get_db
from models.contact import ContactForm

router = APIRouter(prefix="/api", tags=["Contact"])

# ── SMTP Settings ────────────────────────────────────────────────────────
MAIL_USERNAME: str = (
    os.getenv("MAIL_USERNAME")
    or os.getenv("SMTP_USER")
    or os.getenv("EMAIL_USER", "")
)
MAIL_PASSWORD: str = (
    os.getenv("MAIL_PASSWORD")
    or os.getenv("SMTP_PASSWORD")
    or os.getenv("EMAIL_PASSWORD", "")
)
MAIL_FROM: str = (
    os.getenv("MAIL_FROM")
    or os.getenv("SMTP_FROM")
    or os.getenv("EMAIL_FROM", "sahilkutty92@gmail.com")
)
MAIL_TO: str = os.getenv("MAIL_TO") or os.getenv("SMTP_TO") or MAIL_FROM
MAIL_SERVER: str = (
    os.getenv("MAIL_SERVER")
    or os.getenv("SMTP_HOST")
    or "smtp.gmail.com"
)
MAIL_PORT: int = int(os.getenv("MAIL_PORT") or os.getenv("SMTP_PORT") or "587")
MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "Sahil Ahamed Portfolio")


def _looks_like_placeholder(value: str) -> bool:
    """Return True for unset/example credentials that should not trigger SMTP."""
    normalized = value.strip().lower()
    if not normalized:
        return True
    placeholder_fragments = (
        "your_",
        "your-",
        "your.",
        "example",
        "placeholder",
        "change-this",
    )
    return any(fragment in normalized for fragment in placeholder_fragments)

# Setup fastapi-mail configuration
conf = ConnectionConfig(
    MAIL_USERNAME=MAIL_USERNAME,
    MAIL_PASSWORD=MAIL_PASSWORD,
    MAIL_FROM=MAIL_FROM,
    MAIL_PORT=MAIL_PORT,
    MAIL_SERVER=MAIL_SERVER,
    MAIL_FROM_NAME=MAIL_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


@router.post("/contact")
async def submit_contact(form: ContactForm) -> JSONResponse:
    """
    Receive a contact-form submission, save it to MongoDB (if active),
    and send a formatted email to Sahil via Gmail SMTP using fastapi-mail.
    """
    db = get_db()

    # 1. Save to MongoDB Atlas (if DB is configured)
    if db is not None:
        try:
            document = form.model_dump()
            document["created_at"] = datetime.utcnow()
            await db.contacts.insert_one(document)
            print("[Success] Contact successfully saved to database")
        except Exception as e:
            print(f"[Error] Failed to save contact to database: {e}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"status": "error", "message": "Failed to send. Please try again."}
            )

    # 2. Check SMTP Settings
    if _looks_like_placeholder(MAIL_USERNAME) or _looks_like_placeholder(MAIL_PASSWORD):
        print("[Warning] SMTP credentials are not configured or contain placeholders in .env - returning mock success response for frontend preview.")
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "success",
                "message": "[Preview Mode] Message received successfully (SMTP not configured)."
            }
        )

    # Escape inputs for security and format brief linebreaks
    name_esc = html.escape(form.name)
    email_esc = html.escape(form.email)
    service_esc = html.escape(form.service)
    brief_esc = html.escape(form.brief).replace("\n", "<br>")

    # Format the HTML email template
    html_body = f"""
    <div style="font-family: 'Inter', sans-serif; 
                 background: #0a0a12; color: #ffffff; 
                 padding: 40px; border-radius: 12px;
                 max-width: 600px; margin: auto;">

       <h2 style="color: #A78BFA; font-size: 24px; 
                  margin-bottom: 4px;">
         New Client Inquiry
       </h2>
       <p style="color: #C4B5FD; font-size: 13px; 
                 margin-bottom: 32px;">
         Via sahilahamed.com Contact Form
       </p>

       <table style="width:100%; border-collapse: collapse;">
         <tr>
           <td style="padding: 12px 0; color: #8B8B9A; 
                      font-size: 12px; letter-spacing: 1px; 
                      text-transform: uppercase; width: 140px;">
             Client Name
           </td>
           <td style="padding: 12px 0; color: #ffffff; 
                      font-size: 15px; font-weight: 500;">
             {name_esc}
           </td>
         </tr>
         <tr style="border-top: 1px solid #1e1e2e;">
           <td style="padding: 12px 0; color: #8B8B9A; 
                      font-size: 12px; letter-spacing: 1px; 
                      text-transform: uppercase;">
             Email
           </td>
           <td style="padding: 12px 0;">
             <a href="mailto:{email_esc}" 
                style="color: #22D3EE; 
                       text-decoration: none;">
               {email_esc}
             </a>
           </td>
         </tr>
         <tr style="border-top: 1px solid #1e1e2e;">
           <td style="padding: 12px 0; color: #8B8B9A; 
                      font-size: 12px; letter-spacing: 1px; 
                      text-transform: uppercase;">
             Service Needed
           </td>
           <td style="padding: 12px 0;">
             <span style="background: #1e1e3a; 
                          color: #A78BFA; 
                          padding: 4px 14px; 
                          border-radius: 20px; 
                          font-size: 13px;">
               {service_esc}
             </span>
           </td>
         </tr>
         <tr style="border-top: 1px solid #1e1e2e;">
           <td style="padding: 12px 0; color: #8B8B9A; 
                      font-size: 12px; letter-spacing: 1px; 
                      text-transform: uppercase; 
                      vertical-align: top;">
             Project Brief
           </td>
           <td style="padding: 12px 0; color: #E0D7FF; 
                      font-size: 14px; line-height: 1.7;">
             {brief_esc}
           </td>
         </tr>
       </table>

       <div style="margin-top: 32px; padding-top: 24px; 
                   border-top: 1px solid #1e1e2e; 
                   text-align: center;">
         <a href="mailto:{email_esc}" 
            style="display: inline-block; 
                   background: linear-gradient(135deg, #8B5CF6, #06B6D4);
                   color: white; 
                   padding: 12px 32px; 
                   border-radius: 6px; 
                   text-decoration: none; 
                   font-size: 14px; 
                   letter-spacing: 1px;">
           REPLY TO CLIENT
         </a>
       </div>

       <p style="text-align: center; color: #4a4a6a; 
                 font-size: 11px; margin-top: 24px;">
         This message was sent from your portfolio website.
       </p>
     </div>
    """

    message = MessageSchema(
        subject=f"🎬 New Project Inquiry from {form.name}",
        recipients=[MAIL_TO],
        body=html_body,
        subtype=MessageType.html,
        headers={"Reply-To": form.email},
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
        print(f"[Success] Email notification successfully sent to {MAIL_FROM}")
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"status": "success", "message": "Email sent successfully"}
        )
    except Exception as e:
        print(f"[Error] Failed to send email via SMTP: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"status": "error", "message": "Failed to send. Please try again."}
        )
