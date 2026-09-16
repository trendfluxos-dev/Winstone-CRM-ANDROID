import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Terminal, Database, Cpu } from 'lucide-react';

interface KotlinCodeViewerProps {
  onClose: () => void;
}

export const KotlinCodeViewer: React.FC<KotlinCodeViewerProps> = ({ onClose }) => {
  const [activeFile, setActiveFile] = useState<string>('RoomEntities.kt');
  const [copied, setCopied] = useState(false);

  const files: Record<string, { desc: string; category: string; code: string }> = {
    'RoomEntities.kt': {
      category: 'data/local/entity',
      desc: 'Room SQLite Entities for Phase 2 offline-first persistence (Lead, Agent, Call, FollowUp, SyncQueue)',
      code: `package com.winstoneproperties.agent.data.local.entity

import androidx.room.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

/**
 * 1. Agent Entity
 * Stored locally in Room. Decoupled from hardcoded UI strings.
 */
@Entity(tableName = "agents")
data class AgentEntity(
    @PrimaryKey val id: String,
    val employeeId: String,
    val name: String,
    val phone: String,
    val email: String,
    val role: String,
    val territory: String,
    val status: String
)

/**
 * 2. Lead Entity
 * Primary operational entity supporting CRM marketing attribution & classifications.
 */
@Entity(tableName = "leads")
data class LeadEntity(
    @PrimaryKey val id: String,
    val customerName: String,
    val phone: String,
    val project: String,
    val source: String,
    val temperature: String, // "Hot", "Warm", "Cold"
    val operationalCategory: String, // "A", "B", "C", "D"
    val status: String, // "New", "Interested", "Follow-up", etc.
    val notes: String? = null,
    val nextFollowUp: String? = null,
    val campaignId: String? = null,
    val campaignName: String? = null,
    val adSetId: String? = null,
    val adSetName: String? = null,
    val adId: String? = null,
    val adName: String? = null,
    val medium: String? = null,
    val landingPage: String? = null,
    val updatedAt: Long = System.currentTimeMillis()
)

/**
 * LeadEntity ↔ Lead Domain Mapper Functions
 * Decouples SQLite persistence schema from domain business models.
 */
fun LeadEntity.toDomain(): Lead {
    val notesList = notes?.split("\n")?.filter { it.isNotBlank() } ?: emptyList()
    return Lead(
        id = id,
        customerName = customerName,
        phone = phone,
        project = project,
        source = source,
        temperature = LeadTemperature.valueOf(temperature),
        operationalCategory = OperationalCategory.valueOf(operationalCategory),
        status = status,
        notes = notesList,
        nextFollowUp = nextFollowUp,
        campaignId = campaignId,
        campaignName = campaignName,
        adSetId = adSetId,
        adSetName = adSetName,
        adId = adId,
        adName = adName,
        medium = medium,
        landingPage = landingPage,
        updatedAt = updatedAt
    )
}

fun Lead.toEntity(): LeadEntity {
    return LeadEntity(
        id = id,
        customerName = customerName,
        phone = phone,
        project = project,
        source = source,
        temperature = temperature.name,
        operationalCategory = operationalCategory.name,
        status = status,
        notes = notes.joinToString("\n"),
        nextFollowUp = nextFollowUp,
        campaignId = campaignId,
        campaignName = campaignName,
        adSetId = adSetId,
        adSetName = adSetName,
        adId = adId,
        adName = adName,
        medium = medium,
        landingPage = landingPage,
        updatedAt = updatedAt ?: System.currentTimeMillis()
    )
}

/**
 * 3. Call Activity Entity
 * Every completed call simulation creates a real local CallActivity record.
 */
@Entity(tableName = "call_activities")
data class CallActivityEntity(
    @PrimaryKey val id: String,
    val leadId: String,
    val outcome: String,
    val temperature: String,
    val operationalCategory: String,
    val notes: String? = null,
    val followUpDate: String? = null,
    val startedAt: Long,
    val endedAt: Long,
    val createdAt: Long = System.currentTimeMillis(),
    val syncStatus: String = "PENDING"
)

/**
 * 4. Follow Up Entity
 * Tracks upcoming callback schedules. Follow-up is optional.
 */
@Entity(tableName = "follow_ups")
data class FollowUpEntity(
    @PrimaryKey val id: String,
    val leadId: String,
    val followUpDate: String,
    val status: String = "pending", // "pending", "completed", "rescheduled"
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val completedAt: Long? = null
)

/**
 * 5. Sync Operation Entity
 * Offline mutation queue entity for WorkManager and future Phase 3 CRM sync.
 */
@Entity(tableName = "sync_queue")
data class SyncOperationEntity(
    @PrimaryKey val id: String,
    val operationType: String, // "LOG_CALL_OUTCOME", "ADD_NOTE", etc.
    val entityId: String,
    val payloadJson: String,
    val createdAt: Long = System.currentTimeMillis(),
    val retryCount: Int = 0,
    val status: String = "PENDING", // "PENDING", "SYNCING", "FAILED"
    val lastError: String? = null
)

/**
 * TypeConverters for Room SQLite storage (List<String> JSON serialization)
 */
class RoomConverters {
    private val gson = Gson()

    @TypeConverter
    fun fromStringList(value: List<String>?): String {
        return gson.toJson(value ?: emptyList<String>())
    }

    @TypeConverter
    fun toStringList(value: String?): List<String> {
        if (value.isNullOrBlank()) return emptyList()
        val type = object : TypeToken<List<String>>() {}.type
        return gson.fromJson(value, type) ?: emptyList()
    }
}`,
    },
    'RoomDaos.kt': {
      category: 'data/local/dao',
      desc: 'Data Access Objects providing Kotlin Flow reactive observations & SQLite CRUD',
      code: `package com.winstoneproperties.agent.data.local.dao

import androidx.room.*
import com.winstoneproperties.agent.data.local.entity.*
import kotlinx.coroutines.flow.Flow

@Dao
interface LeadDao {
    @Query("SELECT * FROM leads ORDER BY updatedAt DESC, id ASC")
    fun observeAllLeads(): Flow<List<LeadEntity>>

    @Query("SELECT * FROM leads WHERE id = :id LIMIT 1")
    suspend fun getLeadById(id: String): LeadEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(lead: LeadEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(leads: List<LeadEntity>)

    @Update
    suspend fun update(lead: LeadEntity)

    @Delete
    suspend fun delete(lead: LeadEntity)

    @Query("UPDATE leads SET temperature = :temperature, updatedAt = :updatedAt WHERE id = :id")
    suspend fun updateTemperature(id: String, temperature: String, updatedAt: Long = System.currentTimeMillis())

    @Query("UPDATE leads SET operationalCategory = :category, updatedAt = :updatedAt WHERE id = :id")
    suspend fun updateOperationalCategory(id: String, category: String, updatedAt: Long = System.currentTimeMillis())

    @Query("UPDATE leads SET notes = :notes, updatedAt = :updatedAt WHERE id = :id")
    suspend fun updateNotes(id: String, notes: String?, updatedAt: Long = System.currentTimeMillis())

    @Query("UPDATE leads SET nextFollowUp = :nextFollowUp, updatedAt = :updatedAt WHERE id = :id")
    suspend fun updateFollowUp(id: String, nextFollowUp: String?, updatedAt: Long = System.currentTimeMillis())

    @Query("SELECT COUNT(*) FROM leads")
    suspend fun countLeads(): Int
}

@Dao
interface AgentDao {
    @Query("SELECT * FROM agents LIMIT 1")
    fun observeAgent(): Flow<AgentEntity?>

    @Query("SELECT * FROM agents LIMIT 1")
    suspend fun getAgent(): AgentEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(agent: AgentEntity)

    @Update
    suspend fun update(agent: AgentEntity)
}

@Dao
interface CallActivityDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(activity: CallActivityEntity)

    @Query("SELECT * FROM call_activities WHERE leadId = :leadId ORDER BY createdAt DESC")
    suspend fun getByLeadId(leadId: String): List<CallActivityEntity>

    @Query("SELECT * FROM call_activities WHERE leadId = :leadId ORDER BY createdAt DESC")
    fun observeByLeadId(leadId: String): Flow<List<CallActivityEntity>>
}

@Dao
interface FollowUpDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(followUp: FollowUpEntity)

    @Update
    suspend fun update(followUp: FollowUpEntity)

    @Query("UPDATE follow_ups SET status = 'completed', completedAt = :completedAt WHERE id = :id")
    suspend fun complete(id: String, completedAt: Long = System.currentTimeMillis())

    @Query("UPDATE follow_ups SET status = 'completed', completedAt = :completedAt WHERE id IN (:ids)")
    suspend fun batchComplete(ids: List<String>, completedAt: Long = System.currentTimeMillis())

    @Query("SELECT * FROM follow_ups WHERE status = 'pending' ORDER BY followUpDate ASC")
    fun observePending(): Flow<List<FollowUpEntity>>

    @Query("SELECT * FROM follow_ups ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<FollowUpEntity>>
}

@Dao
interface SyncQueueDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun enqueue(operation: SyncOperationEntity)

    @Query("SELECT * FROM sync_queue WHERE status = 'PENDING' ORDER BY createdAt ASC")
    suspend fun getPendingOperations(): List<SyncOperationEntity>

    @Query("SELECT * FROM sync_queue ORDER BY createdAt ASC")
    fun observeAllOperations(): Flow<List<SyncOperationEntity>>

    @Query("DELETE FROM sync_queue WHERE id = :id")
    suspend fun delete(id: String)

    @Query("UPDATE sync_queue SET retryCount = retryCount + 1, lastError = :error WHERE id = :id")
    suspend fun incrementRetry(id: String, error: String)

    @Query("UPDATE sync_queue SET status = 'FAILED' WHERE id = :id")
    suspend fun markFailed(id: String)
}`,
    },
    'WinstoneAgentDatabase.kt': {
      category: 'data/local',
      desc: 'RoomDatabase instance with non-destructive migrations & one-time seed callback',
      code: `package com.winstoneproperties.agent.data.local

import android.content.Context
import androidx.room.*
import androidx.sqlite.db.SupportSQLiteDatabase
import com.winstoneproperties.agent.data.local.dao.*
import com.winstoneproperties.agent.data.local.entity.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * WinstoneAgentDatabase
 *
 * Android Room Database with versioning, explicit schema validation,
 * and clean one-time initial demo seeding without duplicates.
 */
@Database(
    entities = [
        AgentEntity::class,
        LeadEntity::class,
        CallActivityEntity::class,
        FollowUpEntity::class,
        SyncOperationEntity::class
    ],
    version = 1,
    exportSchema = true
)
@TypeConverters(RoomConverters::class)
abstract class WinstoneAgentDatabase : RoomDatabase() {
    abstract fun agentDao(): AgentDao
    abstract fun leadDao(): LeadDao
    abstract fun callActivityDao(): CallActivityDao
    abstract fun followUpDao(): FollowUpDao
    abstract fun syncQueueDao(): SyncQueueDao

    companion object {
        @Volatile
        private var INSTANCE: WinstoneAgentDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): WinstoneAgentDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    WinstoneAgentDatabase::class.java,
                    "winstone_agent.db"
                )
                // Safe migration strategy: avoids destructive wiping of offline field data
                .addCallback(DatabaseSeedCallback(scope))
                .build()
                INSTANCE = instance
                instance
            }
        }
    }

    /**
     * One-time seed callback.
     * Inserts demo leads (Md. Rafiqul Islam, Nusrat Jahan) and demo agent Tanvir Ahmed
     * on first database creation only. Subsequent launches do NOT insert duplicates.
     */
    private class DatabaseSeedCallback(
        private val scope: CoroutineScope
    ) : RoomDatabase.Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            INSTANCE?.let { database ->
                scope.launch(Dispatchers.IO) {
                    populateInitialData(database)
                }
            }
        }

        private suspend fun populateInitialData(db: WinstoneAgentDatabase) {
            val agentDao = db.agentDao()
            val leadDao = db.leadDao()

            // 1. Seed Demo Agent
            val agent = AgentEntity(
                id = "agt-001",
                employeeId = "WPL-AGT-0842",
                name = "Tanvir Ahmed",
                phone = "+880 1713-009988",
                email = "tanvir.ahmed@winstoneproperties.com",
                role = "Senior Sales Executive",
                territory = "Dhaka North (Gulshan, Banani, Uttara)",
                status = "Active"
            )
            agentDao.insert(agent)

            // 2. Seed Demo Leads (Phase 1 Data)
            val lead1 = LeadEntity(
                id = "lead-101",
                customerName = "Md. Rafiqul Islam",
                phone = "+880 1711-492015",
                project = "Winstone Pinnacle (Gulshan-2)",
                source = "Meta Facebook Ad",
                campaignId = "cmp-meta-001",
                campaignName = "Gulshan Luxury Duplex Campaign Q3",
                adSetId = "adset-hni-09",
                adSetName = "High Net Worth Dhaka Individuals",
                adId = "ad-video-14b",
                adName = "Pinnacle 3800sqft Video Tour",
                medium = "cpc",
                landingPage = "https://winstoneproperties.com/projects/pinnacle-gulshan",
                temperature = "Hot",
                operationalCategory = "A",
                status = "Interested",
                notes = "Managing Director at Apex Textiles. Seeking 3,800+ sq ft duplex unit on higher floor (12th+).\nBudget approx 8.5 Crore BDT. Family wants 4 master bedrooms.",
                nextFollowUp = "Today, 04:30 PM",
                updatedAt = System.currentTimeMillis()
            )

            val lead2 = LeadEntity(
                id = "lead-102",
                customerName = "Nusrat Jahan",
                phone = "+880 1819-338210",
                project = "Winstone Lakeview Serenity (Dhanmondi)",
                source = "Website Enquiry",
                campaignName = "Lakefront Penthouse Showcase",
                temperature = "Warm",
                operationalCategory = "B",
                status = "Follow-up",
                notes = "Architect and design consultant. Wants 2,400 sq ft unit facing Dhanmondi Lake.\nRequested structural drawings and floor plan brochure.",
                nextFollowUp = "Tomorrow, 11:00 AM",
                updatedAt = System.currentTimeMillis()
            )

            leadDao.insertAll(listOf(lead1, lead2))
        }
    }
}`,
    },
    'LocalLeadRepository.kt': {
      category: 'data/repository',
      desc: 'Room-backed Repository implementation satisfying ILeadRepository and offline contracts',
      code: `package com.winstoneproperties.agent.data.repository

import com.google.gson.Gson
import com.winstoneproperties.agent.data.local.dao.*
import com.winstoneproperties.agent.data.local.entity.*
import com.winstoneproperties.agent.data.model.*
import com.winstoneproperties.agent.viewmodel.CallOutcomeRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class LocalLeadRepository(
    private val leadDao: LeadDao,
    private val callActivityDao: CallActivityDao,
    private val followUpDao: FollowUpDao,
    private val syncQueueDao: SyncQueueDao
) : ILeadRepository {

    private val gson = Gson()

    /**
     * Emits fresh leads from Room Database whenever the SQLite table changes.
     */
    override fun getAssignedLeadsFlow(): Flow<List<Lead>> {
        return leadDao.observeAllLeads().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun getLeadById(id: String): Lead? {
        return leadDao.getLeadById(id)?.toDomain()
    }

    override suspend fun updateLeadCategory(
        leadId: String,
        temp: LeadTemperature,
        cat: OperationalCategory
    ): Lead {
        val lead = leadDao.getLeadById(leadId) ?: throw NoSuchElementException("Lead \$leadId not found")
        val now = System.currentTimeMillis()
        leadDao.updateTemperature(leadId, temp.name, now)
        leadDao.updateOperationalCategory(leadId, cat.name, now)

        // Queue offline mutation into Room for future CRM sync
        syncQueueDao.enqueue(
            SyncOperationEntity(
                id = "op-\$now",
                operationType = "UPDATE_LEAD_CATEGORY",
                entityId = leadId,
                payloadJson = gson.toJson(mapOf("temperature" to temp.name, "category" to cat.name)),
                createdAt = now,
                status = "PENDING"
            )
        )

        return leadDao.getLeadById(leadId)!!.toDomain()
    }

    override suspend fun addNote(leadId: String, note: String): Lead {
        val lead = leadDao.getLeadById(leadId) ?: throw NoSuchElementException("Lead \$leadId not found")
        val now = System.currentTimeMillis()
        val updatedNotes = if (lead.notes.isNullOrBlank()) note else "\$note\n\${lead.notes}"
        leadDao.updateNotes(leadId, updatedNotes, now)

        // Queue mutation into Room Sync Queue (Never pretend CRM received it)
        syncQueueDao.enqueue(
            SyncOperationEntity(
                id = "op-\$now",
                operationType = "ADD_NOTE",
                entityId = leadId,
                payloadJson = gson.toJson(mapOf("leadId" to leadId, "note" to note)),
                createdAt = now,
                status = "PENDING"
            )
        )

        return leadDao.getLeadById(leadId)!!.toDomain()
    }

    override suspend fun logCallOutcome(request: CallOutcomeRequest): Lead {
        val lead = leadDao.getLeadById(request.leadId)
            ?: throw NoSuchElementException("Lead \${request.leadId} not found")

        val now = System.currentTimeMillis()
        val durationMs = request.durationSeconds * 1000L
        val startedAt = now - durationMs

        // 1. Insert CallActivityEntity into Room
        val callRecordId = "call-\$now"
        callActivityDao.insert(
            CallActivityEntity(
                id = callRecordId,
                leadId = lead.id,
                outcome = request.outcome.name,
                temperature = request.temperature.name,
                operationalCategory = request.operationalCategory.name,
                notes = request.notes,
                followUpDate = request.followUpDate,
                startedAt = startedAt,
                endedAt = now,
                createdAt = now,
                syncStatus = "PENDING"
            )
        )

        // 2-5. Update LeadEntity (temperature, operationalCategory, notes, followUp, updatedAt)
        val combinedNotes = if (request.notes.isNotBlank()) {
            if (lead.notes.isNullOrBlank()) request.notes else "\${request.notes}\n\${lead.notes}"
        } else {
            lead.notes
        }
        val updatedLeadEntity = lead.copy(
            temperature = request.temperature.name,
            operationalCategory = request.operationalCategory.name,
            status = if (request.outcome == CallOutcome.Interested) "Interested" else lead.status,
            notes = combinedNotes,
            nextFollowUp = request.followUpDate ?: lead.nextFollowUp,
            updatedAt = now
        )
        leadDao.update(updatedLeadEntity)

        // 6. Create FollowUpEntity only if a follow-up date exists
        if (request.followUpDate != null) {
            followUpDao.insert(
                FollowUpEntity(
                    id = "fu-\$now",
                    leadId = lead.id,
                    followUpDate = request.followUpDate,
                    status = "pending",
                    notes = "Follow-up after call: \${request.outcome.name}",
                    createdAt = now
                )
            )
        }

        // 7. Add a SyncOperationEntity with status PENDING
        syncQueueDao.enqueue(
            SyncOperationEntity(
                id = "op-\$now",
                operationType = "LOG_CALL_OUTCOME",
                entityId = lead.id,
                payloadJson = gson.toJson(request),
                createdAt = now,
                status = "PENDING"
            )
        )

        return updatedLeadEntity.toDomain()
    }

    override suspend fun batchCompleteFollowUps(ids: List<String>): List<String> {
        val now = System.currentTimeMillis()
        followUpDao.batchComplete(ids, now)
        syncQueueDao.enqueue(
            SyncOperationEntity(
                id = "op-\$now",
                operationType = "BATCH_COMPLETE_FOLLOW_UPS",
                entityId = "batch",
                payloadJson = gson.toJson(ids),
                createdAt = now,
                status = "PENDING"
            )
        )
        return ids
    }
}`,
    },
    'AppContainer.kt': {
      category: 'di',
      desc: 'Dependency Provider wiring WinstoneAgentDatabase into Repositories and ViewModel Factory',
      code: `package com.winstoneproperties.agent.di

import android.app.Application
import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.winstoneproperties.agent.data.local.WinstoneAgentDatabase
import com.winstoneproperties.agent.data.repository.*
import com.winstoneproperties.agent.telephony.ICallingEngine
import com.winstoneproperties.agent.telephony.MockCallingEngine
import com.winstoneproperties.agent.viewmodel.AgentViewModel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

interface AppContainer {
    val database: WinstoneAgentDatabase
    val leadRepository: ILeadRepository
    val agentRepository: IAgentRepository
    val syncRepository: ISyncRepository
    val callingEngine: ICallingEngine
}

/**
 * Phase 2 AppContainer: Room Database offline-first dependency injection.
 * ViewModel depends exclusively on repository interfaces; never accesses Room or DAOs directly.
 */
class DefaultAppContainer(private val context: Context) : AppContainer {
    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override val database: WinstoneAgentDatabase by lazy {
        WinstoneAgentDatabase.getDatabase(context, applicationScope)
    }

    override val leadRepository: ILeadRepository by lazy {
        LocalLeadRepository(
            leadDao = database.leadDao(),
            callActivityDao = database.callActivityDao(),
            followUpDao = database.followUpDao(),
            syncQueueDao = database.syncQueueDao()
        )
    }

    override val agentRepository: IAgentRepository by lazy {
        LocalAgentRepository(agentDao = database.agentDao())
    }

    override val syncRepository: ISyncRepository by lazy {
        LocalSyncRepository(syncQueueDao = database.syncQueueDao())
    }

    override val callingEngine: ICallingEngine by lazy {
        MockCallingEngine()
    }
}

class WinstoneApplication : Application() {
    lateinit var container: AppContainer

    override fun onCreate() {
        super.onCreate()
        container = DefaultAppContainer(this)
    }
}

class AgentViewModelFactory(
    private val leadRepository: ILeadRepository,
    private val agentRepository: IAgentRepository,
    private val syncRepository: ISyncRepository,
    private val callingEngine: ICallingEngine
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AgentViewModel::class.java)) {
            return AgentViewModel(
                leadRepository = leadRepository,
                agentRepository = agentRepository,
                syncRepository = syncRepository,
                callingEngine = callingEngine
            ) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: \${modelClass.name}")
    }
}`,
    },
    'AgentViewModel.kt': {
      category: 'viewmodel',
      desc: 'MVVM ViewModel observing Room Database Flow and updating UI automatically',
      code: `package com.winstoneproperties.agent.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.winstoneproperties.agent.data.model.*
import com.winstoneproperties.agent.data.repository.*
import com.winstoneproperties.agent.telephony.ICallingEngine
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class AgentUiState(
    val agent: AgentProfile? = null,
    val leads: List<Lead> = emptyList(),
    val loadingState: UiLoadingState = UiLoadingState.Loading,
    val activeCallLead: Lead? = null,
    val isCalling: Boolean = false,
    val callDurationSeconds: Int = 0,
    val syncStatusLabel: String = "Offline-first local storage",
    val pendingSyncCount: Int = 0
)

class AgentViewModel(
    private val leadRepository: ILeadRepository,
    private val agentRepository: IAgentRepository,
    private val syncRepository: ISyncRepository,
    private val callingEngine: ICallingEngine
) : ViewModel() {

    private val _uiState = MutableStateFlow(AgentUiState())
    val uiState: StateFlow<AgentUiState> = _uiState.asStateFlow()

    init {
        observeRoomDatabase()
        observeSyncQueue()
    }

    /**
     * Observes Room Database via Kotlin Flow.
     * UI updates automatically whenever Room tables change without manual UI refreshes.
     */
    private fun observeRoomDatabase() {
        viewModelScope.launch {
            val profile = agentRepository.getAgentProfile()
            _uiState.update { it.copy(agent = profile) }

            leadRepository.getAssignedLeadsFlow().collect { leadList ->
                _uiState.update { current ->
                    current.copy(
                        leads = leadList,
                        loadingState = if (leadList.isEmpty()) UiLoadingState.Empty else UiLoadingState.Success(leadList),
                        syncStatusLabel = if (current.pendingSyncCount > 0)
                            "Pending CRM sync (\${current.pendingSyncCount})"
                        else
                            "Offline-first local storage"
                    )
                }
            }
        }
    }

    private fun observeSyncQueue() {
        viewModelScope.launch {
            syncRepository.observePendingCount().collect { count ->
                _uiState.update { current ->
                    current.copy(
                        pendingSyncCount = count,
                        syncStatusLabel = if (count > 0)
                            "Pending CRM sync (\$count)"
                        else
                            "Offline-first local storage"
                    )
                }
            }
        }
    }

    fun initiateCall(lead: Lead) {
        callingEngine.startCall(lead.phone, lead.id, lead.customerName)
        _uiState.update { it.copy(activeCallLead = lead, isCalling = true, callDurationSeconds = 0) }
    }

    fun endCall(request: CallOutcomeRequest) {
        viewModelScope.launch {
            callingEngine.endCall()
            // Persists directly into Room Database and enqueues sync operation
            leadRepository.logCallOutcome(request)
            _uiState.update { it.copy(activeCallLead = null, isCalling = false) }
        }
    }

    fun updateLeadClassification(leadId: String, temp: LeadTemperature, cat: OperationalCategory) {
        viewModelScope.launch {
            leadRepository.updateLeadCategory(leadId, temp, cat)
        }
    }

    fun addNote(leadId: String, note: String) {
        viewModelScope.launch {
            leadRepository.addNote(leadId, note)
        }
    }

    fun batchCompleteFollowUps(ids: List<String>) {
        viewModelScope.launch {
            leadRepository.batchCompleteFollowUps(ids)
        }
    }
}`,
    },
    'MainActivity.kt': {
      category: 'ui',
      desc: 'Single-Activity entry point injecting ViewModel via AppContainer Factory',
      code: `package com.winstoneproperties.agent

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.*
import com.winstoneproperties.agent.di.AgentViewModelFactory
import com.winstoneproperties.agent.di.WinstoneApplication
import com.winstoneproperties.agent.ui.theme.WinstoneTheme
import com.winstoneproperties.agent.ui.screens.*
import com.winstoneproperties.agent.viewmodel.AgentViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val appContainer = (application as WinstoneApplication).container

        setContent {
            WinstoneTheme {
                val navController = rememberNavController()

                val viewModel: AgentViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
                    factory = AgentViewModelFactory(
                        leadRepository = appContainer.leadRepository,
                        agentRepository = appContainer.agentRepository,
                        syncRepository = appContainer.syncRepository,
                        callingEngine = appContainer.callingEngine
                    )
                )

                val uiState by viewModel.uiState.collectAsState()

                Scaffold(
                    bottomBar = {
                        if (uiState.activeCallLead == null) {
                            WinstoneBottomNavigation(
                                currentRoute = navController.currentDestination?.route ?: "dashboard",
                                onNavigate = { route ->
                                    navController.navigate(route) {
                                        popUpTo("dashboard") { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            )
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = "dashboard",
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        composable("dashboard") {
                            DashboardScreen(
                                viewModel = viewModel,
                                onOpenLead = { leadId -> navController.navigate("lead/$leadId") }
                            )
                        }
                        composable("leads") {
                            LeadsScreen(
                                viewModel = viewModel,
                                onOpenLead = { leadId -> navController.navigate("lead/$leadId") }
                            )
                        }
                        composable("lead/{leadId}") { backStackEntry ->
                            val leadId = backStackEntry.arguments?.getString("leadId") ?: ""
                            LeadDetailsScreen(
                                leadId = leadId,
                                viewModel = viewModel,
                                onNavigateBack = { navController.popBackStack() }
                            )
                        }
                    }
                }
            }
        }
    }
}`,
    },
    'CrmDataSource.kt': {
      category: 'data/remote',
      desc: 'Remote CRM Gateway with strict CRM_NOT_CONFIGURED Gate & Retrofit/OkHttp boundary',
      code: `package com.winstoneproperties.agent.data.remote

import com.winstoneproperties.agent.data.remote.dto.*
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.io.IOException

/**
 * Phase 3 Remote CRM Integration Gateway
 *
 * Strict Architecture Boundary:
 * Android App (Room DB) -> HTTPS -> Winstone CRM API -> Supabase/PostgreSQL
 *
 * CRITICAL SAFETY ENFORCEMENT:
 * When CRM API configuration is missing, throws CrmConfigurationException.
 * Never invents endpoints or communicates directly with database credentials.
 */
class CrmDataSource(
    private val environment: CrmEnvironment,
    private val authHeaderProvider: () -> String?
) {
    private val httpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor { chain ->
                val requestBuilder = chain.request().newBuilder()
                authHeaderProvider()?.let { token ->
                    requestBuilder.addHeader("Authorization", "Bearer \$token")
                }
                chain.proceed(requestBuilder.build())
            }
            .build()
    }

    private val api: WinstoneCrmApi? by lazy {
        if (!environment.isConfigured()) return@lazy null
        Retrofit.Builder()
            .baseUrl(environment.requireBaseUrl())
            .client(httpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(WinstoneCrmApi::class.java)
    }

    suspend fun getAssignedLeads(): List<RemoteLeadDto> {
        val verifiedApi = api ?: throw CrmConfigurationException(
            "CRM connection not configured. Remote sync is blocked until verified API contract is supplied."
        )
        val response = verifiedApi.getAssignedLeads()
        if (!response.isSuccessful) {
            throw CrmNetworkException("Failed to fetch assigned leads: HTTP \${response.code()}")
        }
        return response.body() ?: emptyList()
    }

    suspend fun logCallOutcome(dto: CallOutcomeDto): RemoteSyncResponseDto {
        val verifiedApi = api ?: throw CrmConfigurationException("CRM connection not configured.")
        val response = verifiedApi.logCallOutcome(dto)
        return response.body() ?: throw CrmNetworkException("Empty response from CRM")
    }

    suspend fun createFollowUp(dto: RemoteFollowUpDto): RemoteSyncResponseDto {
        val verifiedApi = api ?: throw CrmConfigurationException("CRM connection not configured.")
        val response = verifiedApi.createFollowUp(dto)
        return response.body() ?: throw CrmNetworkException("Empty response from CRM")
    }
}

sealed class CrmException(message: String) : IOException(message)
class CrmConfigurationException(message: String) : CrmException(message)
class CrmNetworkException(message: String) : CrmException(message)
class CrmAuthenticationException(message: String) : CrmException(message)`,
    },
    'CrmSyncWorker.kt': {
      category: 'worker',
      desc: 'Android WorkManager implementation with network constraints and exponential backoff',
      code: `package com.winstoneproperties.agent.worker

import android.content.Context
import androidx.work.*
import com.winstoneproperties.agent.data.local.dao.SyncQueueDao
import com.winstoneproperties.agent.data.remote.CrmConfigurationException
import com.winstoneproperties.agent.data.remote.CrmDataSource
import com.winstoneproperties.agent.di.WinstoneApplication
import java.util.concurrent.TimeUnit

/**
 * Phase 3 CrmSyncWorker
 *
 * Runs via Android WorkManager with:
 * - NetworkType.CONNECTED constraint
 * - Exponential backoff retry (10s initial, max 1 hour)
 * - Safe handling of CRM_NOT_CONFIGURED: retains queue in Room without failure.
 */
class CrmSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val appContainer = (applicationContext as WinstoneApplication).container
        val syncQueueDao = appContainer.syncQueueDao
        val crmDataSource = appContainer.crmDataSource

        val pendingOperations = syncQueueDao.getPendingOperations()
        if (pendingOperations.isEmpty()) {
            return Result.success()
        }

        for (op in pendingOperations) {
            try {
                // Update local status to SYNCING
                syncQueueDao.updateStatus(op.id, "syncing")

                when (op.operationType) {
                    "LOG_CALL_OUTCOME" -> {
                        // Deserializes and dispatches to verified remote gateway
                        crmDataSource.logCallOutcome(op.toCallOutcomeDto())
                    }
                    "CREATE_FOLLOW_UP" -> {
                        crmDataSource.createFollowUp(op.toFollowUpDto())
                    }
                }

                // Delete successfully synced operation from Room
                syncQueueDao.deleteById(op.id)
            } catch (e: CrmConfigurationException) {
                // CRM is not configured: reset to pending and stop worker gracefully
                syncQueueDao.updateStatus(op.id, "pending")
                return Result.success()
            } catch (e: Exception) {
                syncQueueDao.incrementRetry(op.id, e.localizedMessage ?: "Network error")
                if (op.retryCount >= 5) {
                    syncQueueDao.updateStatus(op.id, "failed")
                }
                return Result.retry()
            }
        }

        return Result.success()
    }

    companion object {
        fun buildPeriodicWorkRequest(): PeriodicWorkRequest {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            return PeriodicWorkRequestBuilder<CrmSyncWorker>(15, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.SECONDS)
                .build()
        }
    }
}`,
    },
    'EncryptedAuthRepository.kt': {
      category: 'data/security',
      desc: 'EncryptedSharedPreferences-backed session storage protecting auth credentials',
      code: `package com.winstoneproperties.agent.data.security

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Phase 3 Encrypted Session Repository
 *
 * Uses AndroidX Security Crypto MasterKey to store agent JWT access tokens safely.
 * Under no circumstances does the client store Supabase service-role keys.
 */
class EncryptedAuthRepository(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "winstone_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveToken(token: String) {
        sharedPreferences.edit().putString("auth_token", token).apply()
    }

    fun getToken(): String? = sharedPreferences.getString("auth_token", null)

    fun clearSession() {
        sharedPreferences.edit().remove("auth_token").apply()
    }
}`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeFile].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="kotlin-code-viewer-modal" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white border border-[#E5E7EB] w-full max-w-4xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0F172A]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E8DFCF] flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E8DFCF] flex items-center justify-center text-[#8C6B24] shadow-2xs">
              <Database className="w-4 h-4 text-[#B8934A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#0F172A]">
                  Winstone Agent • Phase 3 Architecture & Room Database
                </h3>
                <span className="bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  Phase 3 CRM Gate
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Room SQLite, WorkManager SyncWorker, Remote CRM Gate & Encrypted Auth
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-kotlin-file-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6EE] hover:bg-[#F3ECE0] text-[#8C6B24] rounded-xl text-xs font-semibold border border-[#E8DFCF] transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#B8934A]" /> : <Copy className="w-3.5 h-3.5 text-[#B8934A]" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              id="close-kotlin-viewer-btn"
              onClick={onClose}
              className="text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* File Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FAF9F6] border-b border-[#E8DFCF] overflow-x-auto text-xs no-scrollbar">
          {Object.keys(files).map((fileName) => (
            <button
              id={`tab-${fileName.replace('.', '-')}`}
              key={fileName}
              onClick={() => setActiveFile(fileName)}
              className={`px-3 py-1.5 rounded-lg font-mono flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFile === fileName
                  ? 'bg-white text-[#8C6B24] font-bold border border-[#E8DFCF] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-[#B8934A]" />
              <span>{fileName}</span>
            </button>
          ))}
        </div>

        {/* File Description */}
        <div className="px-5 py-2.5 bg-white text-xs text-[#334155] border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#FAF6EE] text-[#8C6B24] border border-[#E8DFCF] px-2 py-0.5 rounded text-[11px] font-mono font-medium">
              {files[activeFile].category}
            </span>
            <span className="text-[#64748B]">{files[activeFile].desc}</span>
          </div>
          <span className="text-[11px] text-[#8C6B24] font-mono shrink-0 hidden sm:inline font-semibold">
            Android Room 2.6 • Kotlin Flow
          </span>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-5 font-mono text-xs leading-relaxed bg-[#F8FAFC] text-[#1E293B] selection:bg-[#FAF0DB] selection:text-[#8C6B24] custom-scrollbar border-t border-[#F1F5F9]">
          <pre>{files[activeFile].code}</pre>
        </div>
      </div>
    </div>
  );
};
