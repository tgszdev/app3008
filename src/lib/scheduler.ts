/**
 * Sistema de Agendamento Integrado
 * Executa tarefas automaticamente usando Node.js cron
 */

// Importação condicional para evitar problemas no Vercel
let cron: any;
if (typeof window === 'undefined') {
  cron = require('node-cron');
}

interface ScheduledTask {
  name: string;
  schedule: string;
  task: () => Promise<void>;
  isRunning: boolean;
}

class Scheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private isInitialized = false;

  /**
   * Inicializa o sistema de agendamento
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.log('⚠️ Scheduler já foi inicializado');
      return;
    }

    // Verificar se estamos no servidor (Vercel)
    if (typeof window !== 'undefined') {
      console.log('⚠️ Scheduler não pode ser inicializado no cliente');
      return;
    }

    if (!cron) {
      console.log('⚠️ node-cron não está disponível');
      return;
    }

    console.log('🚀 Inicializando sistema de agendamento...');
    
    // Configurar tarefas
    this.setupTasks();
    
    this.isInitialized = true;
    console.log('✅ Sistema de agendamento inicializado com sucesso');
  }

  /**
   * Configura todas as tarefas agendadas
   */
  private setupTasks(): void {
    // Tarefa 1: Escalação automática (a cada 5 minutos)
    this.addTask('auto-escalation', '*/5 * * * *', async () => {
      console.log('🔄 [SCHEDULER] Executando escalação automática...');
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/api/escalation/auto-execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Internal-Scheduler/1.0'
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ [SCHEDULER] Escalação executada:', result.message);
        } else {
          console.error('❌ [SCHEDULER] Erro na escalação:', response.status);
        }
      } catch (error) {
        console.error('❌ [SCHEDULER] Erro ao executar escalação:', error);
      }
    });

    // Tarefa 2: Processamento de e-mails (a cada 2 minutos)
    this.addTask('email-processing', '*/2 * * * *', async () => {
      console.log('📧 [SCHEDULER] Processando e-mails de escalação...');
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/api/escalation/process-emails`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Internal-Scheduler/1.0'
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ [SCHEDULER] E-mails processados:', result.message);
        } else {
          console.error('❌ [SCHEDULER] Erro no processamento de e-mails:', response.status);
        }
      } catch (error) {
        console.error('❌ [SCHEDULER] Erro ao processar e-mails:', error);
      }
    });

    // Tarefa 3: Limpeza de logs antigos (diariamente às 2h)
    this.addTask('cleanup-logs', '0 2 * * *', async () => {
      console.log('🧹 [SCHEDULER] Limpando logs antigos...');
      try {
        // Limpar logs de escalação com mais de 30 dias
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/api/admin/cleanup-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Internal-Scheduler/1.0'
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ [SCHEDULER] Logs limpos:', result.message);
        } else {
          console.error('❌ [SCHEDULER] Erro na limpeza de logs:', response.status);
        }
      } catch (error) {
        console.error('❌ [SCHEDULER] Erro ao limpar logs:', error);
      }
    });
  }

  /**
   * Adiciona uma nova tarefa agendada
   */
  private addTask(name: string, schedule: string, task: () => Promise<void>): void {
    if (this.tasks.has(name)) {
      console.log(`⚠️ Tarefa '${name}' já existe`);
      return;
    }

    const scheduledTask: ScheduledTask = {
      name,
      schedule,
      task,
      isRunning: false
    };

    // Validar cron expression
    if (!cron || !cron.validate(schedule)) {
      console.error(`❌ Cron expression inválida para tarefa '${name}': ${schedule}`);
      return;
    }

    // Agendar a tarefa
    const cronJob = cron.schedule(schedule, async () => {
      if (scheduledTask.isRunning) {
        console.log(`⏳ [SCHEDULER] Tarefa '${name}' ainda está executando, pulando...`);
        return;
      }

      scheduledTask.isRunning = true;
      const startTime = Date.now();
      
      try {
        console.log(`🔄 [SCHEDULER] Iniciando tarefa '${name}'...`);
        await scheduledTask.task();
        
        const duration = Date.now() - startTime;
        console.log(`✅ [SCHEDULER] Tarefa '${name}' concluída em ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ [SCHEDULER] Erro na tarefa '${name}' após ${duration}ms:`, error);
      } finally {
        scheduledTask.isRunning = false;
      }
    }, {
      scheduled: false, // Não iniciar automaticamente
      timezone: 'America/Sao_Paulo'
    });

    this.tasks.set(name, scheduledTask);
    cronJob.start();
    
    console.log(`✅ [SCHEDULER] Tarefa '${name}' agendada: ${schedule}`);
  }

  /**
   * Inicia uma tarefa específica
   */
  public startTask(name: string): boolean {
    const task = this.tasks.get(name);
    if (!task) {
      console.error(`❌ Tarefa '${name}' não encontrada`);
      return false;
    }

    // A tarefa já está rodando via cron
    console.log(`✅ Tarefa '${name}' já está ativa`);
    return true;
  }

  /**
   * Para uma tarefa específica
   */
  public stopTask(name: string): boolean {
    const task = this.tasks.get(name);
    if (!task) {
      console.error(`❌ Tarefa '${name}' não encontrada`);
      return false;
    }

    // Para o cron job
    if (cron && cron.getTasks) {
      const cronJob = cron.getTasks().get(name);
      if (cronJob) {
        cronJob.stop();
        console.log(`⏹️ Tarefa '${name}' parada`);
        return true;
      }
    }

    return false;
  }

  /**
   * Lista todas as tarefas
   */
  public listTasks(): Array<{name: string, schedule: string, isRunning: boolean}> {
    return Array.from(this.tasks.values()).map(task => ({
      name: task.name,
      schedule: task.schedule,
      isRunning: task.isRunning
    }));
  }

  /**
   * Executa uma tarefa manualmente
   */
  public async executeTask(name: string): Promise<boolean> {
    const task = this.tasks.get(name);
    if (!task) {
      console.error(`❌ Tarefa '${name}' não encontrada`);
      return false;
    }

    try {
      console.log(`🔄 [SCHEDULER] Executando tarefa '${name}' manualmente...`);
      await task.task();
      console.log(`✅ [SCHEDULER] Tarefa '${name}' executada com sucesso`);
      return true;
    } catch (error) {
      console.error(`❌ [SCHEDULER] Erro ao executar tarefa '${name}':`, error);
      return false;
    }
  }

  /**
   * Para todas as tarefas
   */
  public stopAll(): void {
    console.log('⏹️ Parando todas as tarefas...');
    if (cron && cron.getTasks) {
      cron.getTasks().forEach((cronJob: any, name: string) => {
        cronJob.stop();
        console.log(`⏹️ Tarefa '${name}' parada`);
      });
    }
  }

  /**
   * Status do sistema
   */
  public getStatus(): {
    isInitialized: boolean;
    totalTasks: number;
    runningTasks: number;
    tasks: Array<{name: string, schedule: string, isRunning: boolean}>;
  } {
    const tasks = this.listTasks();
    const runningTasks = tasks.filter(task => task.isRunning).length;

    return {
      isInitialized: this.isInitialized,
      totalTasks: tasks.length,
      runningTasks,
      tasks
    };
  }
}

// Instância singleton
const scheduler = new Scheduler();

export default scheduler;
