# Development Setup

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Access to the team database

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd F25-Team14
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

#### Database Configuration
Contact the team lead for database credentials:
- `DB_HOST`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`

#### Email Configuration (Resend)

For **development/testing**, you can use Resend's test domain:
```env
RESEND_API_KEY=your_test_api_key
EMAIL_USER=onboarding@resend.dev
CLIENT_URL=http://localhost:3000
```

**Note**: With the test domain, emails can only be sent to your own verified email address.

For **full email functionality** (sending to any email):
1. Create a free account at [resend.com](https://resend.com)
2. Verify a domain (or use the team's verified domain: `4910-talladeganights-project.com`)
3. Create an API key
4. Update your `.env`:
   ```env
   RESEND_API_KEY=re_your_actual_api_key
   EMAIL_USER=noreply@4910-talladeganights-project.com
   CLIENT_URL=http://localhost:3000
   ```

### 4. Run the Application

Start both the server and client:
```bash
npm run dev
```

This will start:
- **Server**: http://localhost:3001
- **Client**: http://localhost:3000

Or run them separately:
```bash
# Server only
npm run server

# Client only
npm run client
```

## Troubleshooting

### Email not sending
- Verify your `RESEND_API_KEY` is correct
- Check that `EMAIL_USER` matches your verified domain
- Restart the server after changing `.env` values

### Database connection errors
- Verify database credentials are correct
- Check network connectivity to the database host
- Ensure your IP is whitelisted (if using AWS RDS)

## Production Deployment

When deploying to production:
1. Set environment variables in your hosting platform (not in a `.env` file)
2. Update `CLIENT_URL` to your production frontend URL
3. Ensure the database is accessible from your production environment
4. Use production-grade API keys for Resend
