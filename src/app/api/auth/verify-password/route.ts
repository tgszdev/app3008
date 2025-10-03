import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { password, hashedPassword } = await request.json()

    if (!password || !hashedPassword) {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const valid = await bcrypt.compare(password, hashedPassword)
    return NextResponse.json({ valid })
  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}

// Forçar esta rota a usar o runtime Node.js ao invés do Edge
export const runtime = 'nodejs'