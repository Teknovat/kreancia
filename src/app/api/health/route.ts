import { NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/prisma'
import { env } from '@/lib/env'

export async function GET() {
  try {
    // Check database connection
    const isDatabaseHealthy = await checkDatabaseConnection()

    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: {
        connected: isDatabaseHealthy,
        status: isDatabaseHealthy ? 'healthy' : 'unhealthy'
      },
      version: process.env.npm_package_version || '0.1.0'
    }

    if (!isDatabaseHealthy) {
      return NextResponse.json(
        {
          ...healthStatus,
          status: 'ERROR',
          message: 'Database connection failed'
        },
        { status: 503 }
      )
    }

    return NextResponse.json(healthStatus)
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}