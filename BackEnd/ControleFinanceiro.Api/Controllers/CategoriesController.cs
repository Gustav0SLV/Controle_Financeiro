using ControleFinanceiro.Application.Categories.CreateCategory;
using ControleFinanceiro.Application.Categories.DeleteCategory;
using ControleFinanceiro.Application.Categories.GetCategories;
using ControleFinanceiro.Domain.Categories;
using Microsoft.AspNetCore.Mvc;

namespace ControleFinanceiro.Api.Controllers;

[ApiController]
[Route("api/categories")]
public sealed class CategoriesController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromServices] GetCategoriesHandler handler,
        CancellationToken ct)
    {
        var items = await handler.Handle(new GetCategoriesQuery(), ct);
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateCategoryRequest req,
        [FromServices] CreateCategoryHandler handler,
        CancellationToken ct)
    {
        try
        {
            var id = await handler.Handle(new CreateCategoryCommand(req.Name, req.Type), ct);
            return Created($"/api/categories/{id}", new { id });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
        [FromServices] DeleteCategoryHandler handler,
        CancellationToken ct)
    {
        try
        {
            await handler.Handle(new DeleteCategoryCommand(id), ct);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    public sealed record CreateCategoryRequest(
        string Name,
        CategoryType Type
    );
}