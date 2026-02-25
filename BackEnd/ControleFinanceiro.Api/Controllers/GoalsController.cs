using ControleFinanceiro.Application.Goals.Monthly.AddMonthlySaving;
using ControleFinanceiro.Application.Goals.Monthly.GetMonthlyGoal;
using ControleFinanceiro.Application.Goals.Monthly.UpsertMonthlyGoal;
using ControleFinanceiro.Application.Goals.Monthly.DeleteMonthlySaving;
using ControleFinanceiro.Application.Goals.Monthly.UpdateMonthlySaving;
using Microsoft.AspNetCore.Mvc;

namespace ControleFinanceiro.Api.Controllers;

[ApiController]
[Route("api/goals")]
public sealed class GoalsController : ControllerBase
{
    private readonly GetMonthlyGoalHandler _get;
    private readonly UpsertMonthlyGoalHandler _upsert;
    private readonly AddMonthlySavingHandler _addSaving;
    private readonly UpdateMonthlySavingHandler _updateSaving;
    private readonly DeleteMonthlySavingHandler _deleteSaving;

    public GoalsController(
        GetMonthlyGoalHandler get,
        UpsertMonthlyGoalHandler upsert,
        AddMonthlySavingHandler addSaving,
        UpdateMonthlySavingHandler updateSaving,
        DeleteMonthlySavingHandler deleteSaving)
    {
        _get = get;
        _upsert = upsert;
        _addSaving = addSaving;
        _updateSaving = updateSaving;
        _deleteSaving = deleteSaving;
    }

    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthly([FromQuery] int year, [FromQuery] int month, CancellationToken ct)
    {
        var dto = await _get.Handle(year, month, ct);
        return Ok(dto);
    }

    // Agora esse PUT seta só a meta
    [HttpPut("monthly")]
    public async Task<IActionResult> PutMonthly([FromBody] UpsertMonthlyGoalCommand cmd, CancellationToken ct)
    {
        await _upsert.Handle(cmd, ct);
        return NoContent();
    }

    // adiciona uma entrada de guardado
    [HttpPost("monthly/savings")]
    public async Task<IActionResult> AddSaving([FromBody] AddMonthlySavingCommand cmd, CancellationToken ct)
    {
        await _addSaving.Handle(cmd, ct);
        return NoContent();
    }

    [HttpPut("monthly/savings/{id:guid}")]
    public async Task<IActionResult> UpdateSaving([FromRoute] Guid id, [FromBody] UpdateMonthlySavingCommand body, CancellationToken ct)
    {
        // garante que o id da rota manda
        var cmd = body with { Id = id };
        await _updateSaving.Handle(cmd, ct);
        return NoContent();
    }

    [HttpDelete("monthly/savings/{id:guid}")]
    public async Task<IActionResult> DeleteSaving([FromRoute] Guid id, CancellationToken ct)
    {
        await _deleteSaving.Handle(id, ct);
        return NoContent();
    }
}