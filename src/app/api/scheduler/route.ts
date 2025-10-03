import { NextRequest, NextResponse } from 'next/server';
import scheduler from '@/lib/scheduler';

/**
 * API para gerenciar o sistema de agendamento
 */

// GET - Status do scheduler
export async function GET() {
  try {
    const status = scheduler.getStatus();
    
    return NextResponse.json({
      success: true,
      data: status,
      message: 'Status do scheduler obtido com sucesso'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Erro ao obter status do scheduler'
    }, { status: 500 });
  }
}

// POST - Controlar o scheduler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, taskName } = body;

    switch (action) {
      case 'initialize':
        scheduler.initialize();
        return NextResponse.json({
          success: true,
          message: 'Scheduler inicializado com sucesso'
        });

      case 'start':
        if (!taskName) {
          return NextResponse.json({
            success: false,
            message: 'Nome da tarefa é obrigatório para iniciar'
          }, { status: 400 });
        }
        
        const started = scheduler.startTask(taskName);
        return NextResponse.json({
          success: started,
          message: started ? `Tarefa '${taskName}' iniciada` : `Erro ao iniciar tarefa '${taskName}'`
        });

      case 'stop':
        if (!taskName) {
          return NextResponse.json({
            success: false,
            message: 'Nome da tarefa é obrigatório para parar'
          }, { status: 400 });
        }
        
        const stopped = scheduler.stopTask(taskName);
        return NextResponse.json({
          success: stopped,
          message: stopped ? `Tarefa '${taskName}' parada` : `Erro ao parar tarefa '${taskName}'`
        });

      case 'execute':
        if (!taskName) {
          return NextResponse.json({
            success: false,
            message: 'Nome da tarefa é obrigatório para executar'
          }, { status: 400 });
        }
        
        const executed = await scheduler.executeTask(taskName);
        return NextResponse.json({
          success: executed,
          message: executed ? `Tarefa '${taskName}' executada com sucesso` : `Erro ao executar tarefa '${taskName}'`
        });

      case 'stop-all':
        scheduler.stopAll();
        return NextResponse.json({
          success: true,
          message: 'Todas as tarefas foram paradas'
        });

      case 'list':
        const tasks = scheduler.listTasks();
        return NextResponse.json({
          success: true,
          data: tasks,
          message: 'Lista de tarefas obtida com sucesso'
        });

      default:
        return NextResponse.json({
          success: false,
          message: 'Ação não reconhecida. Use: initialize, start, stop, execute, stop-all, list'
        }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Erro ao controlar scheduler'
    }, { status: 500 });
  }
}
